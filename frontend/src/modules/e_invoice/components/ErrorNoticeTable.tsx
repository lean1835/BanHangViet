import React, { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Plus,
  Send,
  Eye,
} from "lucide-react";
import { formatDate, normalizeDateToYYYYMMDD } from "@/utils/dateFormatter";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { IInvoiceErrorNotice } from "../types/IInvoiceErrorNotice";
import {
  useGetErrorNoticesQuery,
  useSendErrorNoticeToTaxMutation,
} from "../services/invoiceErrorNoticeApi";

interface ErrorNoticeTableProps {
  onCreateNew: () => void;
  onSelectNotice: (noticeId: string) => void;
  statusFilter?: string;
  handlingTypeFilter?: string;
  searchQuery?: string;
  fromDate?: string;
  toDate?: string;
  onResetFilters?: () => void;
}

const PAGE_SIZE = 10;

export const ErrorNoticeTable: React.FC<ErrorNoticeTableProps> = ({
  onCreateNew,
  onSelectNotice,
  statusFilter = "ALL",
  handlingTypeFilter = "ALL",
  searchQuery = "",
  fromDate = "",
  toDate = "",
  onResetFilters,
}) => {
  const { showSuccess, showError } = useNotification();
  const [page, setPage] = useState<number>(0);

  const {
    data: noticesResponse,
    isLoading,
    refetch,
  } = useGetErrorNoticesQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page: 0,
    size: 1000,
  });

  const [sendNoticeApi, { isLoading: isSending }] = useSendErrorNoticeToTaxMutation();

  const displayedNotices = useMemo(() => {
    const rawList: IInvoiceErrorNotice[] = noticesResponse?.result?.content || [];
    return rawList.filter((notice) => {
      // 1. Filter by status
      if (statusFilter !== "ALL" && notice.status !== statusFilter) {
        return false;
      }
      // 2. Filter by handlingType
      if (handlingTypeFilter && handlingTypeFilter !== "ALL") {
        const hasMatch = notice.items?.some(
          (it) => it.handlingType === handlingTypeFilter
        );
        if (!hasMatch) return false;
      }
      // 3. Filter by fromDate
      const noticeDate = normalizeDateToYYYYMMDD(notice.createdAt);
      if (fromDate && (!noticeDate || noticeDate < fromDate)) {
        return false;
      }
      // 4. Filter by toDate
      if (toDate && (!noticeDate || noticeDate > toDate)) {
        return false;
      }
      // 5. Quick search (noticeCode, taxAuthorityCode, createdByUserName, invoice numbers, reason)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = (notice.noticeCode || "").toLowerCase().includes(q);
        const matchTax = (notice.taxAuthorityCode || "").toLowerCase().includes(q);
        const matchUser = (notice.createdByUserName || "").toLowerCase().includes(q);
        const matchInvoice = notice.items?.some(
          (item) =>
            (item.invoiceNumber || "").toLowerCase().includes(q) ||
            (item.reason || "").toLowerCase().includes(q)
        );
        if (!matchCode && !matchTax && !matchUser && !matchInvoice) return false;
      }
      return true;
    });
  }, [noticesResponse, statusFilter, handlingTypeFilter, fromDate, toDate, searchQuery]);

  // Reset page to 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, handlingTypeFilter, fromDate, toDate, searchQuery]);

  const totalElements = displayedNotices.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  const paginatedNotices = useMemo(() => {
    const start = page * PAGE_SIZE;
    return displayedNotices.slice(start, start + PAGE_SIZE);
  }, [displayedNotices, page]);

  const handleSendToTax = async (e: React.MouseEvent, noticeId: string) => {
    e.stopPropagation();
    try {
      await sendNoticeApi(noticeId).unwrap();
      showSuccess("Đã gửi thông báo sai sót tới Cơ quan Thuế thành công!");
      refetch();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể gửi thông báo tới Cơ quan Thuế."));
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-extrabold text-slate-800 text-sm">
              Danh sách Thông báo hóa đơn có sai sót
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {displayedNotices.length} thông báo
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Theo dõi, lập và gửi thông báo sai sót tới Cơ quan Thuế theo quy định Nghị định 123/2020/NĐ-CP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-kv-blue-primary hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Lập thông báo sai sót</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9.5px]">
              <th className="p-3">Mã thông báo</th>
              <th className="p-3">Loại thông báo</th>
              <th className="p-3">Ngày lập</th>
              <th className="p-3">Người lập</th>
              <th className="p-3 text-center">Số lượng HĐ</th>
              <th className="p-3 text-center">Trạng thái CQT</th>
              <th className="p-3">Mã tiếp nhận CQT</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <div className="inline-block w-6 h-6 border-2 border-kv-blue-primary border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs font-bold">Đang tải danh sách thông báo sai sót...</p>
                </td>
              </tr>
            ) : displayedNotices.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>Chưa có thông báo sai sót nào phù hợp.</p>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    {onResetFilters &&
                      (statusFilter !== "ALL" ||
                        handlingTypeFilter !== "ALL" ||
                        Boolean(searchQuery) ||
                        Boolean(fromDate) ||
                        Boolean(toDate)) && (
                        <button
                          type="button"
                          onClick={onResetFilters}
                          className="inline-flex items-center gap-1 text-xs text-slate-600 font-bold hover:text-kv-blue-primary underline cursor-pointer"
                        >
                          Xóa bộ lọc tìm kiếm
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={onCreateNew}
                      className="inline-flex items-center gap-1 text-xs text-kv-blue-primary font-bold hover:underline cursor-pointer"
                    >
                      + Lập thông báo mới ngay
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedNotices.map((notice) => (
                <tr
                  key={notice.id}
                  onClick={() => onSelectNotice(notice.id)}
                  className="transition-colors hover:bg-slate-50 cursor-pointer focus:outline-none"
                  tabIndex={0}
                >
                  <td className="p-3 font-mono font-bold text-slate-900">
                    {notice.noticeCode}
                  </td>
                  <td className="p-3 font-bold text-slate-600">
                    Thông báo sai sót
                  </td>
                  <td className="p-3 text-slate-500 font-medium">
                    {formatDate(notice.createdAt)}
                  </td>
                  <td className="p-3 text-slate-700 font-bold">
                    {notice.createdByUserName || "-"}
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                      {notice.items?.length || 0}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold inline-block border ${
                        notice.status === "ACCEPTED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : notice.status === "DRAFT"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {notice.status === "ACCEPTED"
                        ? "Đã tiếp nhận"
                        : notice.status === "DRAFT"
                        ? "Bản nháp"
                        : "Bị từ chối"}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-600">
                    {notice.taxAuthorityCode || "-"}
                  </td>
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectNotice(notice.id)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {notice.status === "DRAFT" && (
                        <button
                          type="button"
                          onClick={(e) => handleSendToTax(e, notice.id)}
                          disabled={isSending}
                          className="p-1.5 hover:bg-blue-50 text-kv-blue-primary rounded transition disabled:opacity-50"
                          title="Gửi Cơ quan Thuế"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <TablePaginationFooter
          currentPage={page}
          pageSize={PAGE_SIZE}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={setPage}
          recordUnit="thông báo"
        />
      )}
    </div>
  );
};
