import React from "react";
import {
  Search,
} from "lucide-react";

export type TRetryErrorCategoryFilter = "ALL" | "INVALID_TAX_CODE" | "NETWORK_ERROR" | "MAX_RETRY" | "OTHER";
export type TRetryCountFilter = "ALL" | "HIGH" | "LOW";

export interface AutoRetrySidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  errorCategoryFilter: TRetryErrorCategoryFilter;
  setErrorCategoryFilter: (category: TRetryErrorCategoryFilter) => void;
  retryCountFilter: TRetryCountFilter;
  setRetryCountFilter: (count: TRetryCountFilter) => void;
}

export const AutoRetrySidebar: React.FC<AutoRetrySidebarProps> = ({
  searchQuery,
  setSearchQuery,
  errorCategoryFilter,
  setErrorCategoryFilter,
  retryCountFilter,
  setRetryCountFilter,
}) => {
  return (
    <>
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        Bộ lọc Hàng đợi lỗi
      </div>

      {/* Tìm kiếm nhanh */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Tìm kiếm nhanh
        </span>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Mã HĐ, mã tra cứu, MST..."
            className="w-full border border-slate-300 h-9 pl-8 pr-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
        </div>
      </div>

      {/* Phân loại nhóm lỗi CQT */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Phân loại nhóm lỗi
        </span>
        <select
          value={errorCategoryFilter}
          onChange={(e) => setErrorCategoryFilter(e.target.value as TRetryErrorCategoryFilter)}
          className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold bg-white text-slate-700 cursor-pointer"
        >
          <option value="ALL">Tất cả nhóm lỗi</option>
          <option value="INVALID_TAX_CODE">Sai MST người mua / Chi nhánh</option>
          <option value="NETWORK_ERROR">Lỗi kết nối / CQT bận</option>
          <option value="MAX_RETRY">Quá số lần thử tối đa</option>
          <option value="OTHER">Lỗi dữ liệu khác</option>
        </select>
      </div>

      {/* Lọc theo số lần đã thử */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Số lần đã gửi lại
        </span>
        <select
          value={retryCountFilter}
          onChange={(e) => setRetryCountFilter(e.target.value as TRetryCountFilter)}
          className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold bg-white text-slate-700 cursor-pointer"
        >
          <option value="ALL">Tất cả số lần</option>
          <option value="HIGH">Đã thử nhiều (≥ 3 lần)</option>
          <option value="LOW">Đã thử ít (&lt; 3 lần)</option>
        </select>
      </div>

    </>
  );
};
