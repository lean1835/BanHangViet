import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  useGetActiveInvoiceRangeQuery,
  useGetAllInvoiceRangesQuery,
  useCreateInvoiceRangeMutation,
} from "../services/invoiceRangeApi";
import { useGetInvoiceTemplateQuery } from "../services/settingsApi";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  Hash,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Loader2,
  X,
  Info,
} from "lucide-react";

import type { IInvoiceNumberRange } from "../types/IInvoiceRange";

export interface InvoiceRangeSectionProps {
  currentPattern?: string;
  currentSymbol?: string;
  statusFilter?: string;
  searchQuery?: string;
  showDeclareButton?: boolean;
  isOpenModalExternal?: boolean;
  setIsOpenModalExternal?: (open: boolean) => void;
  onActiveRangeLoaded?: (range: IInvoiceNumberRange | undefined) => void;
}

export const InvoiceRangeSection: React.FC<InvoiceRangeSectionProps> = ({
  currentPattern = "",
  currentSymbol = "",
  statusFilter = "ALL",
  searchQuery = "",
  showDeclareButton = true,
  isOpenModalExternal,
  setIsOpenModalExternal,
  onActiveRangeLoaded,
}) => {
  const { showSuccess, showError } = useNotification();
  const [isOpenModal, setIsOpenModal] = useState(false);

  // Template cấu hình hiện tại của hộ kinh doanh
  const { data: templateResponse } = useGetInvoiceTemplateQuery();
  const configuredPattern = (templateResponse?.result?.invoicePattern || currentPattern || "").trim();
  const configuredSymbol = (templateResponse?.result?.invoiceSymbol || currentSymbol || "").trim();

  // Form State
  const [invoicePattern, setInvoicePattern] = useState(configuredPattern || currentPattern);
  const [invoiceSymbol, setInvoiceSymbol] = useState(configuredSymbol || currentSymbol);
  const [startNumber, setStartNumber] = useState<number | "">("");
  const [endNumber, setEndNumber] = useState<number | "">("");
  const [warningThreshold, setWarningThreshold] = useState<number>(50);

  // Cập nhật giá trị mẫu khi template cấu hình tải xong
  useEffect(() => {
    if (configuredPattern) setInvoicePattern(configuredPattern);
    if (configuredSymbol) setInvoiceSymbol(configuredSymbol);
  }, [configuredPattern, configuredSymbol]);

  // API Hooks
  const {
    data: activeResponse,
    isLoading: isActiveLoading,
    refetch: refetchActive,
  } = useGetActiveInvoiceRangeQuery();

  const {
    data: listResponse,
    isLoading: isListLoading,
    refetch: refetchList,
  } = useGetAllInvoiceRangesQuery({ page: 0, size: 20 });

  const [createRange, { isLoading: isCreating }] = useCreateInvoiceRangeMutation();

  const activeRange = activeResponse?.result;
  const rangeList = React.useMemo(
    () => listResponse?.result?.content || [],
    [listResponse?.result?.content]
  );

  // Dải số đang áp dụng ưu tiên dải số trùng với Mẫu số và Ký hiệu đã cấu hình
  const displayActiveRange = React.useMemo(() => {
    if (configuredPattern && configuredSymbol && rangeList.length > 0) {
      const match = rangeList.find(
        (r) =>
          (r.invoicePattern || "").trim().toUpperCase() === configuredPattern.toUpperCase() &&
          (r.invoiceSymbol || "").trim().toUpperCase() === configuredSymbol.toUpperCase() &&
          r.status !== "EXHAUSTED" &&
          r.remainingCount > 0
      );
      if (match) return match;
    }
    return activeRange;
  }, [rangeList, configuredPattern, configuredSymbol, activeRange]);

  React.useEffect(() => {
    if (displayActiveRange && onActiveRangeLoaded) {
      onActiveRangeLoaded(displayActiveRange);
    }
  }, [displayActiveRange, onActiveRangeLoaded]);

  // Hàm xác định trạng thái hiển thị: CHỈ dải số trùng với cấu hình mẫu hóa đơn mới có trạng thái Đang sử dụng (ACTIVE)
  const getEffectiveStatus = React.useCallback(
    (range: IInvoiceNumberRange): string => {
      if (range.status === "EXHAUSTED" || range.remainingCount === 0) {
        return "EXHAUSTED";
      }
      if (configuredPattern && configuredSymbol) {
        const isMatch =
          (range.invoicePattern || "").trim().toUpperCase() === configuredPattern.toUpperCase() &&
          (range.invoiceSymbol || "").trim().toUpperCase() === configuredSymbol.toUpperCase();
        if (!isMatch) {
          return "INACTIVE";
        }
      }
      return range.status || "ACTIVE";
    },
    [configuredPattern, configuredSymbol]
  );

  const handleOpenModal = React.useCallback(() => {
    // Tự động gợi ý từ số kế tiếp nếu đang có dải số
    if (displayActiveRange) {
      setInvoicePattern(displayActiveRange.invoicePattern || configuredPattern);
      setInvoiceSymbol(displayActiveRange.invoiceSymbol || configuredSymbol);
      const nextStart = (displayActiveRange.endNumber || 0) + 1;
      setStartNumber(nextStart);
      setEndNumber(nextStart + 10000 - 1);
    } else {
      setInvoicePattern(configuredPattern || currentPattern);
      setInvoiceSymbol(configuredSymbol || currentSymbol);
      setStartNumber(1);
      setEndNumber(10000);
    }
    setWarningThreshold(50);
    setIsOpenModal(true);
    setIsOpenModalExternal?.(true);
  }, [displayActiveRange, configuredPattern, configuredSymbol, currentPattern, currentSymbol, setIsOpenModalExternal]);

  const handleCloseModal = React.useCallback(() => {
    setIsOpenModal(false);
    setIsOpenModalExternal?.(false);
  }, [setIsOpenModalExternal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };
    if (isOpenModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpenModal, handleCloseModal]);

  React.useEffect(() => {
    if (isOpenModalExternal) {
      handleOpenModal();
    }
  }, [isOpenModalExternal, handleOpenModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoicePattern.trim()) {
      showError("Vui lòng nhập Mẫu số hóa đơn");
      return;
    }
    if (!invoiceSymbol.trim()) {
      showError("Vui lòng nhập Ký hiệu hóa đơn");
      return;
    }
    if (!startNumber || Number(startNumber) <= 0) {
      showError("Số bắt đầu phải lớn hơn hoặc bằng 1");
      return;
    }
    if (!endNumber || Number(endNumber) < Number(startNumber)) {
      showError("Số kết thúc phải lớn hơn hoặc bằng Số bắt đầu");
      return;
    }
    if (!warningThreshold || Number(warningThreshold) <= 0) {
      showError("Ngưỡng cảnh báo phải lớn hơn 0");
      return;
    }

    try {
      await createRange({
        invoicePattern: invoicePattern.trim(),
        invoiceSymbol: invoiceSymbol.trim().toUpperCase(),
        startNumber: Number(startNumber),
        endNumber: Number(endNumber),
        warningThreshold: Number(warningThreshold),
      }).unwrap();

      showSuccess("Khai báo dải số hóa đơn mới thành công!");
      handleCloseModal();
      refetchActive();
      refetchList();
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(err, "Khai báo dải số thất bại. Vui lòng kiểm tra lại!");
      showError(errMsg);
    }
  };

  const filteredRangeList = React.useMemo(() => {
    return rangeList.filter((range) => {
      const effectiveStatus = getEffectiveStatus(range);
      if (statusFilter && statusFilter !== "ALL" && effectiveStatus !== statusFilter) {
        return false;
      }
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSymbol = (range.invoiceSymbol || "").toLowerCase().includes(q);
        const matchPattern = (range.invoicePattern || "").toLowerCase().includes(q);
        const matchNumbers = `${range.startNumber} ${range.endNumber} ${range.currentNumber}`.includes(q);
        if (!matchSymbol && !matchPattern && !matchNumbers) {
          return false;
        }
      }
      return true;
    });
  }, [rangeList, statusFilter, searchQuery, getEffectiveStatus]);

  const formatInvoiceNumber = (num?: number | null) => {
    if (num === undefined || num === null) return "00000000";
    return String(num).padStart(8, "0");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đang sử dụng
          </span>
        );
      case "WARNING_LOW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Sắp hết số
          </span>
        );
      case "EXHAUSTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Đã hết số
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Không sử dụng
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  // Tính tỷ lệ sử dụng %
  const totalNumbers =
    displayActiveRange && displayActiveRange.endNumber >= displayActiveRange.startNumber
      ? displayActiveRange.endNumber - displayActiveRange.startNumber + 1
      : 0;
  const usedNumbers =
    displayActiveRange && displayActiveRange.currentNumber >= displayActiveRange.startNumber
      ? displayActiveRange.currentNumber - displayActiveRange.startNumber + 1
      : 0;
  const usedPercent = totalNumbers > 0 ? Math.min(100, Math.round((usedNumbers / totalNumbers) * 100)) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-kv-blue-primary rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base leading-tight flex items-center gap-2">
              Quản lý dải số hóa đơn điện tử
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Theo dõi số lượng hóa đơn còn lại và khai báo dải số mới theo Thông tư 78/2021/TT-BTC
            </p>
          </div>
        </div>

        {showDeclareButton && (
          <button
            type="button"
            onClick={handleOpenModal}
            className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Khai báo dải số mới
          </button>
        )}
      </div>

      {/* Active Range Card */}
      {isActiveLoading ? (
        <div className="p-8 flex items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-kv-blue-primary" />
          <span className="text-xs font-semibold">Đang tải thông tin dải số hiện tại...</span>
        </div>
      ) : displayActiveRange ? (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200/80 p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Dải số đang áp dụng:
              </span>
              <span className="text-xs font-black text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-200">
                Mẫu: {displayActiveRange.invoicePattern} | Ký hiệu: {displayActiveRange.invoiceSymbol}
              </span>
            </div>
            <div>{getStatusBadge(getEffectiveStatus(displayActiveRange))}</div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/70 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Dải số được cấp</span>
              <span className="text-sm font-black text-slate-800 mt-1 block font-mono">
                {formatInvoiceNumber(displayActiveRange.startNumber)} - {formatInvoiceNumber(displayActiveRange.endNumber)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Tổng: {totalNumbers.toLocaleString("vi-VN")} số
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200/70 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Số hiện tại (Đã cấp)</span>
              <span className="text-sm font-black text-kv-blue-primary mt-1 block font-mono">
                {formatInvoiceNumber(displayActiveRange.currentNumber)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Đã dùng: {usedNumbers.toLocaleString("vi-VN")} số ({usedPercent}%)
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200/70 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Số lượng còn lại</span>
              <span
                className={`text-sm font-black mt-1 block font-mono ${
                  displayActiveRange.remainingCount <= displayActiveRange.warningThreshold
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}
              >
                {displayActiveRange.remainingCount.toLocaleString("vi-VN")} số
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Ngưỡng báo động: {displayActiveRange.warningThreshold} số
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200/70 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Tốc độ tiêu thụ</span>
              <span className="text-sm font-black text-slate-800 mt-1 block">
                {displayActiveRange.dailyConsumptionRate !== undefined && displayActiveRange.dailyConsumptionRate !== null
                  ? `${displayActiveRange.dailyConsumptionRate.toFixed(1)} số/ngày`
                  : "Chưa đủ dữ liệu"}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {displayActiveRange.dailyConsumptionRate && displayActiveRange.dailyConsumptionRate > 0
                  ? `Dự kiến: ~${Math.round(
                      displayActiveRange.remainingCount / displayActiveRange.dailyConsumptionRate
                    )} ngày`
                  : "Trung bình 7 ngày gần nhất"}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600">
              <span>Tiến độ sử dụng dải số:</span>
              <span className="font-bold">{usedPercent}% đã phát hành</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  displayActiveRange.status === "EXHAUSTED"
                    ? "bg-rose-500"
                    : displayActiveRange.status === "WARNING_LOW"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>

          {/* Warning Banner if Low / Exhausted */}
          {displayActiveRange.warningMessage && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs font-semibold ${
                displayActiveRange.status === "EXHAUSTED"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{displayActiveRange.warningMessage}</p>
                <p className="text-[11px] font-normal mt-0.5">
                  Vui lòng {showDeclareButton ? <span>bấm nút <strong>"Khai báo dải số mới"</strong> phía trên</span> : <span>vào mục <strong>Cấu hình &gt; Mẫu hóa đơn</strong></span>} để không bị gián
                  đoạn quy trình xuất hóa đơn và phê duyệt thuế.
                </p>
              </div>
            </div>
          )}
        </div>

      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3 text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-amber-900">Chưa có dải số hóa đơn đang hoạt động</h4>
            <p className="mt-1 leading-relaxed">
              Hộ kinh doanh chưa khai báo dải số cho mẫu hóa đơn này. Để phát hành hóa đơn và gửi cơ
              quan thuế duyệt cấp mã, vui lòng {showDeclareButton ? <span>bấm nút <strong>"Khai báo dải số mới"</strong></span> : <span>truy cập mục <strong>Cấu hình &gt; Mẫu hóa đơn</strong></span>}.
            </p>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            Lịch sử các dải số đã khai báo
          </h4>
          <span className="text-xs text-slate-400 font-semibold">
            Tổng cộng: {filteredRangeList.length} dải số
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase">
                <th className="py-2.5 px-3">Mẫu số / Ký hiệu</th>
                <th className="py-2.5 px-3">Dải số (Từ - Đến)</th>
                <th className="py-2.5 px-3 text-right">Số hiện tại</th>
                <th className="py-2.5 px-3 text-right">Số còn lại</th>
                <th className="py-2.5 px-3 text-center">Ngưỡng báo</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Ngày khai báo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {isListLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-kv-blue-primary mb-1" />
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : filteredRangeList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    {rangeList.length === 0
                      ? "Chưa có dải số nào được ghi nhận."
                      : "Không tìm thấy dải số nào khớp với bộ lọc."}
                  </td>
                </tr>
              ) : (
                filteredRangeList.map((range) => (
                  <tr key={range.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {range.invoicePattern} / {range.invoiceSymbol}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {formatInvoiceNumber(range.startNumber)} &rarr;{" "}
                      {formatInvoiceNumber(range.endNumber)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-kv-blue-primary">
                      {formatInvoiceNumber(range.currentNumber)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {range.remainingCount.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                      {range.warningThreshold}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {getStatusBadge(getEffectiveStatus(range))}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                      {range.createdAt ? new Date(range.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Khai báo dải số */}
      {isOpenModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseModal();
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-kv-blue-primary rounded-lg">
                    <Hash className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    Khai báo dải số hóa đơn mới
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 text-blue-900 text-xs flex gap-2">
                  <Info className="w-4 h-4 text-kv-blue-primary shrink-0 mt-0.5" />
                  <span>
                    Khai báo dải số mới để tiếp tục phát hành hóa đơn khi dải số cũ sắp hết hoặc đã hết hạn.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">
                      Mẫu số <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={invoicePattern}
                      onChange={(e) => setInvoicePattern(e.target.value)}
                      className="border border-slate-300 h-9 px-3 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-kv-blue-primary"
                      placeholder="VD: 1"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">
                      Ký hiệu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={invoiceSymbol}
                      onChange={(e) => setInvoiceSymbol(e.target.value.toUpperCase())}
                      className="border border-slate-300 h-9 px-3 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-kv-blue-primary uppercase"
                      placeholder="VD: 1C26TAA"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">
                      Từ số <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={startNumber}
                      onChange={(e) => setStartNumber(e.target.value === "" ? "" : Number(e.target.value))}
                      className="border border-slate-300 h-9 px-3 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-kv-blue-primary"
                      placeholder="VD: 1"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">
                      Đến số <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={endNumber}
                      onChange={(e) => setEndNumber(e.target.value === "" ? "" : Number(e.target.value))}
                      className="border border-slate-300 h-9 px-3 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-kv-blue-primary"
                      placeholder="VD: 10000"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Ngưỡng cảnh báo sắp hết số (Số lượng) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={warningThreshold}
                    onChange={(e) => setWarningThreshold(Number(e.target.value))}
                    className="border border-slate-300 h-9 px-3 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-kv-blue-primary"
                    placeholder="Mặc định: 50"
                    required
                  />
                  <span className="text-[11px] text-slate-400">
                    Hệ thống sẽ gửi cảnh báo khi số lượng hóa đơn còn lại nhỏ hơn hoặc bằng ngưỡng này.
                  </span>
                </div>

                <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isCreating}
                    className="px-4 h-9 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-5 h-9 rounded-lg transition-colors flex items-center gap-1.5 text-xs shadow-sm disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...
                      </>
                    ) : (
                      "Khai báo dải số"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
