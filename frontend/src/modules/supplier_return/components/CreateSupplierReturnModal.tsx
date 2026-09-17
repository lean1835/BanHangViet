import React, { useEffect, useMemo, useState } from "react";
import {
  RotateCcw,
  X,
  AlertCircle,
  CheckCircle2,
  Package,
  Building2,
  DollarSign,
  Info,
  Tag,
  Hash,
  FileText,
  Check,
  Clock,
  AlertTriangle,
  Layers,
  PackagePlus,
  HelpCircle,
  Edit3,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/dateFormatter";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useNotification } from "@/hooks/useNotification";
import {
  SUPPLIER_RETURN_REASONS,
  SUPPLIER_RETURN_MESSAGES,
  type TSupplierReturnReason,
} from "@/constants/supplierReturn";
import {
  useCheckReceiptReturnableQuery,
  useCreateSupplierReturnMutation,
} from "../services/supplierReturnApi";
import type { IReceiptReturnableItem } from "../types/ISupplierReturn";

interface CreateSupplierReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId: string | null;
  onSuccess?: (returnId: string) => void;
}

interface ItemRowState {
  item: IReceiptReturnableItem;
  returnQty: string;
  itemReason: string;
  isSelected: boolean;
  error?: string | null;
}

export const CreateSupplierReturnModal: React.FC<CreateSupplierReturnModalProps> = ({
  isOpen,
  onClose,
  receiptId,
  onSuccess,
}) => {
  const { showSuccess, showError } = useNotification();

  const {
    data: checkData,
    isLoading: isChecking,
    error: checkError,
  } = useCheckReceiptReturnableQuery(receiptId || "", {
    skip: !receiptId || !isOpen,
  });

  const [createSupplierReturn, { isLoading: isSubmitting }] =
    useCreateSupplierReturnMutation();

  const [reason, setReason] = useState<TSupplierReturnReason>("Hàng hỏng");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [returnNumber, setReturnNumber] = useState("");
  const [rows, setRows] = useState<ItemRowState[]>([]);

  // Initialize rows when checkData changes
  useEffect(() => {
    if (checkData?.items) {
      setRows(
        checkData.items.map((item) => ({
          item,
          returnQty: "",
          itemReason: "",
          isSelected: false,
          error: null,
        }))
      );
    } else {
      setRows([]);
    }
  }, [checkData]);

  // Handle return quantity change
  const handleQtyChange = (detailId: string, val: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.item.receiptDetailId !== detailId) return row;

        const cleanVal = val.replace(/[^0-9.]/g, "");
        const numVal = parseFloat(cleanVal);
        let error: string | null = null;

        if (cleanVal !== "") {
          if (isNaN(numVal) || numVal <= 0) {
            error = "Số lượng trả phải lớn hơn 0";
          } else if (numVal > row.item.maxAllowedReturnQuantity) {
            error = `Vượt quá số lượng cho phép (${row.item.maxAllowedReturnQuantity} ${row.item.unitName || "cái"})`;
          }
        }

        return {
          ...row,
          returnQty: cleanVal,
          isSelected: cleanVal !== "" && !isNaN(numVal) && numVal > 0,
          error,
        };
      })
    );
  };

  // Quick set max allowed quantity
  const handleSetMaxQty = (detailId: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.item.receiptDetailId !== detailId) return row;
        const maxQty = row.item.maxAllowedReturnQuantity;
        if (maxQty <= 0) return row;
        return {
          ...row,
          returnQty: String(maxQty),
          isSelected: true,
          error: null,
        };
      })
    );
  };

  // Select all with max qty
  const handleSelectAllMax = () => {
    setRows((prev) =>
      prev.map((row) => {
        const maxQty = row.item.maxAllowedReturnQuantity;
        if (maxQty <= 0) return row;
        return {
          ...row,
          returnQty: String(maxQty),
          isSelected: true,
          error: null,
        };
      })
    );
  };

  // Clear all
  const handleClearAll = () => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        returnQty: "",
        isSelected: false,
        error: null,
      }))
    );
  };

  // Computed summary
  const selectedRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.isSelected &&
          !r.error &&
          parseFloat(r.returnQty) > 0 &&
          parseFloat(r.returnQty) <= r.item.maxAllowedReturnQuantity
      ),
    [rows]
  );

  const totalReturnAmount = useMemo(() => {
    return selectedRows.reduce((sum, r) => {
      const qty = parseFloat(r.returnQty) || 0;
      return sum + qty * (r.item.purchasePrice || 0);
    }, 0);
  }, [selectedRows]);

  const hasAnyError = useMemo(
    () => rows.some((r) => !!r.error),
    [rows]
  );

  // Computed return status
  const isFullyReturned = useMemo(() => {
    if (!checkData) return false;
    if (checkData.isFullyReturned) return true;
    if (checkData.returnStatus === "FULLY_RETURNED") return true;
    if (checkData.items && checkData.items.length > 0) {
      return checkData.items.every(
        (it) => (it.remainingReturnableQuantity || 0) <= 0
      );
    }
    return false;
  }, [checkData]);

  const isStockUnavailable = useMemo(() => {
    if (!checkData || isFullyReturned) return false;
    if (checkData.items && checkData.items.length > 0) {
      return checkData.items.every(
        (it) => (it.maxAllowedReturnQuantity || 0) <= 0
      );
    }
    return false;
  }, [checkData, isFullyReturned]);

  const canSubmit = !isFullyReturned && !isStockUnavailable && selectedRows.length > 0 && !hasAnyError && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptId || !canSubmit) return;

    const finalReason = reason === "Khác" ? customReason.trim() || "Khác" : reason;

    const payload = {
      receiptId,
      returnNumber: returnNumber.trim() || undefined,
      reason: finalReason,
      notes: notes.trim() || undefined,
      items: selectedRows.map((r) => ({
        receiptDetailId: r.item.receiptDetailId,
        quantity: parseFloat(r.returnQty),
        itemReason: r.itemReason.trim() || undefined,
      })),
    };

    try {
      const result = await createSupplierReturn(payload).unwrap();
      showSuccess(SUPPLIER_RETURN_MESSAGES.CREATE_SUCCESS);
      onClose();
      if (onSuccess && result.id) {
        onSuccess(result.id);
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, SUPPLIER_RETURN_MESSAGES.CREATE_FAILED);
      showError(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-auth-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supplier-return-modal-title"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shadow-2xs">
              <RotateCcw className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2
                id="supplier-return-modal-title"
                className="text-base font-extrabold text-slate-800 sm:text-lg"
              >
                Lập Phiếu Trả Hàng Cho Nhà Cung Cấp
              </h2>
              <p className="text-xs text-slate-500">
                Phiếu nhập kho:{" "}
                <span className="font-bold text-slate-700">
                  {checkData?.receiptNumber || receiptId}
                </span>{" "}
                {checkData?.receivedAt && (
                  <span>
                    ({formatDateShort(checkData.receivedAt)})
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Supplier and Receipt Info Banner */}
          {isChecking ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-kv-blue-primary border-t-transparent" />
              <span className="text-xs font-semibold">
                Đang kiểm tra thông tin mặt hàng có thể trả...
              </span>
            </div>
          ) : checkError ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs font-semibold">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>
                {getApiErrorMessage(
                  checkError,
                  SUPPLIER_RETURN_MESSAGES.CHECK_RECEIPT_FAILED
                )}
              </span>
            </div>
          ) : checkData ? (
            <>
              {/* Alert if Fully Returned */}
              {isFullyReturned && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 animate-auth-fade-in shadow-2xs">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-rose-900 text-xs sm:text-sm">
                      Phiếu nhập kho này đã được hoàn trả toàn bộ ({checkData.receiptNumber})
                    </h4>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      Tất cả các mặt hàng trong phiếu nhập này đã được trả lại đủ cho nhà cung cấp {checkData.supplierName ? `(${checkData.supplierName})` : ""}. Bạn không thể tiếp tục lập thêm phiếu trả hàng mới cho phiếu nhập này.
                    </p>
                  </div>
                </div>
              )}

              {/* Alert if Stock Unavailable */}
              {isStockUnavailable && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 animate-auth-fade-in shadow-2xs">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-amber-900 text-xs sm:text-sm">
                      Không còn tồn kho để trả ({checkData.receiptNumber})
                    </h4>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Các mặt hàng trong phiếu nhập này hiện không còn đủ số lượng tồn kho thực tế trong cửa hàng để lập phiếu trả lại cho nhà cung cấp.
                    </p>
                  </div>
                </div>
              )}

              {/* Supplier & Debt Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200 text-blue-600 shadow-2xs shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-500 font-medium block">Nhà cung cấp</span>
                    <p className="font-extrabold text-slate-800 text-sm truncate">
                      {checkData.supplierName || "— (Nhập lẻ)"}
                    </p>
                    {checkData.supplierPhone && (
                      <span className="text-xs text-slate-500 font-medium">{checkData.supplierPhone}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200 text-blue-600 shadow-2xs shrink-0">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Công nợ hiện tại</span>
                    <p
                      className={`font-extrabold text-sm ${
                        (checkData.supplierCurrentDebt || 0) < 0
                          ? "text-emerald-600"
                          : (checkData.supplierCurrentDebt || 0) > 0
                          ? "text-rose-600"
                          : "text-slate-700"
                      }`}
                    >
                      {(checkData.supplierCurrentDebt || 0) < 0
                        ? `NCC nợ: ${formatCurrency(Math.abs(checkData.supplierCurrentDebt || 0))}`
                        : formatCurrency(checkData.supplierCurrentDebt || 0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white border border-blue-200 text-blue-600 shadow-2xs shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Tổng tiền phiếu nhập</span>
                    <p className="font-extrabold text-slate-700 text-sm">
                      {formatCurrency(checkData.receiptTotalAmount || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Return Form Options Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                {/* Reason Selection */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-kv-blue-primary" />
                      <span>Lý do trả hàng</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Chọn nguyên nhân để đối soát công nợ và kho với nhà cung cấp
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUPPLIER_RETURN_REASONS.map((r) => {
                      const isSelected = reason === r;
                      const iconNode =
                        r === "Hàng hỏng" ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : r === "Cận hạn" ? (
                          <Clock className="h-3.5 w-3.5" />
                        ) : r === "Sai quy cách" ? (
                          <Layers className="h-3.5 w-3.5" />
                        ) : r === "Giao thừa" ? (
                          <PackagePlus className="h-3.5 w-3.5" />
                        ) : (
                          <HelpCircle className="h-3.5 w-3.5" />
                        );

                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setReason(r)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-kv-blue-primary text-white shadow-xs scale-[1.02] ring-2 ring-blue-500/20"
                              : "bg-slate-50/90 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 shadow-2xs"
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          ) : (
                            <span className="text-slate-400">{iconNode}</span>
                          )}
                          <span>{r}</span>
                        </button>
                      );
                    })}
                  </div>
                  {reason === "Khác" && (
                    <div className="mt-2.5 animate-auth-fade-in flex items-center gap-2">
                      <div className="relative flex-1">
                        <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-kv-blue-primary pointer-events-none" />
                        <input
                          type="text"
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Nhập cụ thể lý do trả hàng khác..."
                          className="w-full h-9.5 pl-9 pr-3.5 text-xs rounded-xl border border-blue-300 bg-blue-50/20 focus:outline-none focus:border-kv-blue-primary focus:bg-white text-slate-800 font-medium transition-all shadow-2xs"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Return Number and Notes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5 border-t border-slate-100">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-slate-400" />
                        <span>Mã phiếu trả</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        Tự động nếu để trống
                      </span>
                    </div>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={returnNumber}
                        onChange={(e) => setReturnNumber(e.target.value)}
                        placeholder="Để trống hệ thống tự sinh mã TH-NCC-..."
                        className="w-full h-10 pl-9 pr-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white focus:outline-none focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 font-semibold text-slate-700 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span>Ghi chú / Diễn giải</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Tùy chọn
                      </span>
                    </div>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ví dụ: Bao bì rách vỡ khi giao hàng, thỏa thuận trả hoàn..."
                        className="w-full h-10 pl-9 pr-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white focus:outline-none focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 font-normal text-slate-700 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                      Danh sách mặt hàng trên phiếu nhập
                    </h3>
                    <span className="text-xs text-slate-500">
                      (Nhập số lượng cần trả lại cho nhà cung cấp)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllMax}
                      disabled={isFullyReturned || isStockUnavailable}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        isFullyReturned || isStockUnavailable
                          ? "text-slate-400 bg-slate-100 cursor-not-allowed"
                          : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                      }`}
                    >
                      Trả tối đa tất cả
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      disabled={isFullyReturned}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        isFullyReturned
                          ? "text-slate-400 bg-slate-100 cursor-not-allowed"
                          : "text-slate-500 bg-slate-100 hover:bg-slate-200"
                      }`}
                    >
                      Xóa trắng
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3">Tên mặt hàng / ĐVT</th>
                        <th className="p-3 text-right">Đơn giá nhập</th>
                        <th className="p-3 text-right">SL Đã nhập</th>
                        <th className="p-3 text-right">Đã trả trước</th>
                        <th className="p-3 text-right">Tồn kho hiện có</th>
                        <th className="p-3 text-right font-extrabold text-blue-700">
                          SL Cho phép trả
                        </th>
                        <th className="p-3 w-40 text-center">SL Trả đợt này</th>
                        <th className="p-3 text-right">Thành tiền (đ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {rows.map((row, idx) => {
                        const qtyNum = parseFloat(row.returnQty) || 0;
                        const subtotal = qtyNum * row.item.purchasePrice;
                        const isMaxZero = row.item.maxAllowedReturnQuantity <= 0;

                        return (
                          <tr
                            key={row.item.receiptDetailId}
                            className={`transition-all ${
                              row.error
                                ? "bg-rose-50/60"
                                : row.isSelected
                                ? "bg-blue-50/40"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="p-3 text-center text-slate-400 font-bold">
                              {idx + 1}
                            </td>

                            <td className="p-3">
                              <span className="font-bold text-slate-800 block">
                                {row.item.productName || "Sản phẩm"}
                              </span>
                              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                                {row.item.productCode && (
                                  <span>Mã: {row.item.productCode}</span>
                                )}
                                <span>• ĐVT: {row.item.unitName || "Cái"}</span>
                              </div>
                            </td>

                            <td className="p-3 text-right text-slate-600 font-semibold">
                              {formatCurrency(row.item.purchasePrice)}
                            </td>

                            <td className="p-3 text-right text-slate-600">
                              {formatNumber(row.item.importedQuantity)}
                            </td>

                            <td className="p-3 text-right text-slate-500">
                              {formatNumber(row.item.previouslyReturnedQuantity)}
                            </td>

                            <td className="p-3 text-right text-slate-700 font-semibold">
                              {formatNumber(row.item.currentStockQuantity)}
                            </td>

                            <td className="p-3 text-right font-extrabold text-blue-700">
                              {formatNumber(row.item.maxAllowedReturnQuantity)}
                            </td>

                            <td className="p-3">
                              <div className="flex flex-col gap-1 items-center">
                                <div className="flex items-center gap-1 w-full">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    disabled={isMaxZero || isFullyReturned}
                                    value={row.returnQty}
                                    onChange={(e) =>
                                      handleQtyChange(
                                        row.item.receiptDetailId,
                                        e.target.value
                                      )
                                    }
                                    placeholder={isFullyReturned ? "Đã trả hết" : "0"}
                                    className={`w-full h-8 px-2 text-center text-xs font-extrabold rounded-lg border transition-all ${
                                      row.error
                                        ? "border-rose-500 bg-white text-rose-600 focus:ring-1 focus:ring-rose-400"
                                        : row.isSelected
                                        ? "border-blue-500 bg-white text-blue-700"
                                        : "border-slate-300 bg-white text-slate-700 focus:border-kv-blue-primary"
                                    } ${
                                      isMaxZero || isFullyReturned
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : ""
                                    }`}
                                  />
                                  {!isMaxZero && !isFullyReturned && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSetMaxQty(row.item.receiptDetailId)
                                      }
                                      title="Điền số lượng tối đa"
                                      className="px-1.5 h-8 text-[10px] font-bold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all shrink-0"
                                    >
                                      Max
                                    </button>
                                  )}
                                </div>
                                {row.error && (
                                  <span className="text-[10px] font-bold text-rose-600 text-left w-full">
                                    {row.error}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-3 text-right font-extrabold text-rose-600">
                              {formatCurrency(subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Policy & Effect Reminder Notice (QTN-23 & QTN-24) */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">
                    Quy tắc nghiệp vụ hệ thống (QTN-23 & QTN-24):
                  </p>
                  <p className="text-amber-700 text-[11px]">
                    1. Tồn kho của các mặt hàng sẽ tự động giảm theo đơn vị cơ sở.
                    <br />
                    2. Công nợ phải trả của nhà cung cấp sẽ tự động giảm trừ{" "}
                    <strong>{formatCurrency(totalReturnAmount)}</strong>
                    {(checkData.supplierCurrentDebt || 0) < totalReturnAmount ? (
                      <span className="text-emerald-800 font-semibold">
                        {" "}(Do công nợ hiện tại nhỏ hơn số tiền trả hàng, phần chênh lệch sẽ ghi nhận Nhà cung cấp nợ lại cửa hàng — có thể thu tiền hoàn tại danh sách Nhà cung cấp).
                      </span>
                    ) : null}
                    .
                    <br />
                    3. Giá vốn bình quân của từng mặt hàng sẽ được hệ thống tính toán lại tự động theo QTN-23.
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
            <div>
              Đã chọn:{" "}
              <span className="font-extrabold text-blue-700 text-sm">
                {selectedRows.length}
              </span>{" "}
              mặt hàng
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
              Tổng tiền trả NCC:{" "}
              <span className="font-extrabold text-rose-600 text-base sm:text-lg">
                {formatCurrency(totalReturnAmount)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-all"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                canSubmit
                  ? "bg-rose-600 hover:bg-rose-700 active:scale-95"
                  : "bg-slate-300 cursor-not-allowed opacity-70"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang xử lý...</span>
                </>
              ) : isFullyReturned ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đã hoàn trả toàn bộ</span>
                </>
              ) : isStockUnavailable ? (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span>Hết tồn kho để trả</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Xác nhận trả hàng</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSupplierReturnModal;
