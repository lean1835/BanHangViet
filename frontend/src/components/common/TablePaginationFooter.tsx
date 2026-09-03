import React from "react";

export interface TablePaginationFooterProps {
  currentPage: number; // 0-indexed
  pageSize?: number; // default 8
  totalElements: number;
  totalPages?: number;
  onPageChange: (newPage: number) => void;
  recordUnit?: string; // default "bản ghi"
}

export const TablePaginationFooter: React.FC<TablePaginationFooterProps> = ({
  currentPage,
  pageSize = 8,
  totalElements,
  totalPages: customTotalPages,
  onPageChange,
  recordUnit = "bản ghi",
}) => {
  const calculatedTotalPages = Math.ceil(totalElements / pageSize) || 1;
  const totalPages = customTotalPages !== undefined ? customTotalPages : calculatedTotalPages;

  if (totalElements <= 0) return null;

  const startRecord = currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);
  const displayCurrentPage = Math.min(currentPage + 1, Math.max(totalPages, 1));

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
      <div>
        Hiển thị bản ghi từ{" "}
        <strong className="text-slate-800 font-bold">{startRecord}</strong> đến{" "}
        <strong className="text-slate-800 font-bold">{endRecord}</strong> trong tổng số{" "}
        <strong className="text-slate-800 font-bold">{totalElements}</strong> {recordUnit}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage <= 0}
          className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700"
        >
          Trang trước
        </button>

        <span className="px-3 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 font-bold text-slate-700">
          Trang {displayCurrentPage} / {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage >= totalPages - 1}
          className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
};
