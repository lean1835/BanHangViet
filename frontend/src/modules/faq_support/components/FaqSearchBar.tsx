import React from "react";
import { Search, X } from "lucide-react";

interface FaqSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export const FaqSearchBar: React.FC<FaqSearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "Nhập từ khóa tìm kiếm (ví dụ: hóa đơn treo, đổi mật khẩu, sửa hóa đơn...)",
}) => {
  return (
    <div className="relative w-full" role="search">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
        <Search className="h-4.5 w-4.5" aria-hidden="true" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClear();
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm font-normal text-slate-800 placeholder-slate-400 transition-all hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
        aria-label="Tìm kiếm câu hỏi thường gặp"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
          aria-label="Xóa nội dung tìm kiếm"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
            <X className="h-3.5 w-3.5" />
          </div>
        </button>
      )}
    </div>
  );
};
