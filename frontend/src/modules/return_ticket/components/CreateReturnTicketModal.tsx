import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, X, ArrowLeft, ArrowRight, Check, AlertTriangle, ShieldAlert } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { USER_ROLES } from "@/constants/roles";
import {
  REFUND_PAYMENT_METHODS,
  REFUND_PAYMENT_METHOD_OPTIONS,
  type TRefundPaymentMethod,
} from "@/constants/returnTicket";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  useLazyCheckInvoiceReturnableQuery,
  useCreateReturnTicketMutation,
} from "../services/returnTicketApi";
import { useGetInvoicesQuery } from "@/modules/e_invoice/services/eInvoiceApi";
import { STORAGE_KEYS } from "@/constants/app";
import type { IReturnableItemDto, IReturnTicket } from "../types/IReturnTicket";
import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";

interface SelectedReturnItem {
  invoiceItemId: string;
  productId?: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxRatePercentage: number;
  returnableQuantity: number;
  isSelected: boolean;
  error?: string | null;
}

interface CreateReturnTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvoiceId?: string;
  currentRole: string;
  onSuccess?: (ticket: IReturnTicket) => void;
}

export const CreateReturnTicketModal: React.FC<CreateReturnTicketModalProps> = ({
  isOpen,
  onClose,
  initialInvoiceId,
  currentRole,
  onSuccess,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const isOwner = currentRole === USER_ROLES.OWNER;

  // Step 1 vs Step 2 State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(initialInvoiceId || "");
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>("");

  // Items & Refund Settings State (Step 2)
  const [selectedItems, setSelectedItems] = useState<SelectedReturnItem[]>([]);
  const [refundPaymentMethod, setRefundPaymentMethod] = useState<TRefundPaymentMethod>(
    REFUND_PAYMENT_METHODS.CASH
  );
  const [reason, setReason] = useState<string>("");
  const [allowOverdueOverride, setAllowOverdueOverride] = useState<boolean>(false);

  // Queries & Mutations
  const [checkInvoice, { data: checkResponse, isLoading: isChecking, isError: isCheckError }] =
    useLazyCheckInvoiceReturnableQuery();

  const { data: invoicesData, isLoading: isLoadingInvoices } = useGetInvoicesQuery(
    {
      status: "ISSUED",
      search: invoiceSearchQuery.trim() || undefined,
      page: 0,
      size: 100,
    },
    { skip: !isOpen }
  );

  // Combine API invoices with local cached invoices for seamless offline/dev experience
  const eligibleInvoices = useMemo(() => {
    const map = new Map<string, IInvoice>();

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.POS_OFFLINE_INVOICES);
      if (raw) {
        const cached: IInvoice[] = JSON.parse(raw);
        cached.forEach((inv) => {
          if (inv.id) map.set(inv.id, inv);
        });
      }
    } catch {
      /* ignore storage parse */
    }

    if (invoicesData?.result?.content) {
      invoicesData.result.content.forEach((inv: IInvoice) => {
        if (inv.id) map.set(inv.id, inv);
      });
    }

    const allList = Array.from(map.values());

    // QTN-18: Only invoices with status ISSUED (Đã cấp mã) are eligible for return
    const filtered = allList.filter((inv: IInvoice) => {
      const isIssued = inv.status === "ISSUED";
      if (!isIssued) return false;

      if (!invoiceSearchQuery.trim()) return true;
      const q = invoiceSearchQuery.trim().toLowerCase();
      const numMatch = (inv.invoiceNumber || "").toLowerCase().includes(q);
      const codeMatch = (inv.lookupCode || "").toLowerCase().includes(q);
      const nameMatch = (inv.buyerName || inv.customer || "").toLowerCase().includes(q);
      const phoneMatch = (inv.buyerPhone || "").toLowerCase().includes(q);
      return numMatch || codeMatch || nameMatch || phoneMatch;
    });

    return filtered;
  }, [invoicesData, invoiceSearchQuery]);

  const [createTicket, { isLoading: isSubmitting }] = useCreateReturnTicketMutation();

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
  });

  // Sync initialInvoiceId
  useEffect(() => {
    if (initialInvoiceId && isOpen) {
      setSelectedInvoiceId(initialInvoiceId);
    }
  }, [initialInvoiceId, isOpen]);

  // Trigger checkInvoice when selectedInvoiceId changes
  useEffect(() => {
    if (selectedInvoiceId && isOpen) {
      checkInvoice(selectedInvoiceId);
    }
  }, [selectedInvoiceId, isOpen, checkInvoice]);

  // Populate selected items when checkResponse arrives
  useEffect(() => {
    if (checkResponse?.result?.items && checkResponse.result.items.length > 0) {
      const items: SelectedReturnItem[] = checkResponse.result.items.map((dto: IReturnableItemDto) => ({
        invoiceItemId: dto.invoiceItemId,
        productId: dto.productId,
        productName: dto.productName,
        unit: dto.unit || "Cái",
        quantity: dto.returnableQuantity > 0 ? 1 : 0,
        unitPrice: dto.unitPrice || 0,
        taxRatePercentage: dto.taxRatePercentage || 0,
        returnableQuantity: dto.returnableQuantity || 0,
        isSelected: dto.returnableQuantity > 0,
        error: null,
      }));
      setSelectedItems(items);
    } else if (selectedInvoiceId && eligibleInvoices.length > 0) {
      const currentInv = eligibleInvoices.find((i) => i.id === selectedInvoiceId);
      if (currentInv && currentInv.items && currentInv.items.length > 0) {
        const items: SelectedReturnItem[] = currentInv.items.map((it: any, idx: number) => {
          const qty = Number(it.quantity) || 1;
          return {
            invoiceItemId: it.id || it.invoiceItemId || `item_${idx}`,
            productId: it.productId,
            productName: it.productName || "Sản phẩm",
            unit: it.unit || "Cái",
            quantity: qty > 0 ? 1 : 0,
            unitPrice: Number(it.unitPrice) || 0,
            taxRatePercentage: Number(it.taxRatePercentage) || 0,
            returnableQuantity: qty,
            isSelected: true,
            error: null,
          };
        });
        setSelectedItems(items);
      }
    }
  }, [checkResponse, selectedInvoiceId, eligibleInvoices]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedInvoiceId(initialInvoiceId || "");
      setInvoiceSearchQuery("");
      setSelectedItems([]);
      setRefundPaymentMethod(REFUND_PAYMENT_METHODS.CASH);
      setReason("");
      setAllowOverdueOverride(false);
    }
  }, [isOpen, initialInvoiceId]);

  const checkData = checkResponse?.result;
  const isInvoiceExpired = checkData?.isExpired || false;

  // Real-time calculations
  const activeItems = useMemo(
    () => selectedItems.filter((it) => it.isSelected && it.quantity > 0),
    [selectedItems]
  );

  const totalBeforeTax = useMemo(
    () => activeItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0),
    [activeItems]
  );

  const totalTaxAmount = useMemo(
    () =>
      activeItems.reduce(
        (sum, it) => sum + (it.quantity * it.unitPrice * it.taxRatePercentage) / 100,
        0
      ),
    [activeItems]
  );

  const totalRefundAmount = totalBeforeTax + totalTaxAmount;

  // Handle item quantity change with real-time validation (QTN-19 - Integer steps)
  const handleQuantityChange = (index: number, valStr: string) => {
    const parsed = parseInt(valStr, 10);
    const num = isNaN(parsed) ? 0 : parsed;

    setSelectedItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      target.quantity = num;

      if (num <= 0) {
        target.error = "Số lượng trả phải là số nguyên lớn hơn 0";
      } else if (num > target.returnableQuantity) {
        target.error = `Vượt quá số lượng còn được trả (Tối đa: ${target.returnableQuantity})`;
      } else {
        target.error = null;
      }

      copy[index] = target;
      return copy;
    });
  };

  const handleToggleItem = (index: number) => {
    setSelectedItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      target.isSelected = !target.isSelected;
      if (target.isSelected && target.quantity === 0 && target.returnableQuantity > 0) {
        target.quantity = 1;
        target.error = null;
      }
      copy[index] = target;
      return copy;
    });
  };

  const hasAnyItemError = selectedItems.some((it) => it.isSelected && Boolean(it.error));
  const isFormValid =
    activeItems.length > 0 &&
    !hasAnyItemError &&
    (!isInvoiceExpired || (isOwner && allowOverdueOverride));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoiceId) {
      showError("Vui lòng chọn hóa đơn gốc cần trả hàng");
      return;
    }

    if (isInvoiceExpired) {
      if (!isOwner) {
        showError("Hóa đơn đã quá thời hạn trả hàng 7 ngày. Chỉ chủ hộ mới có quyền đồng ý ngoại lệ.");
        return;
      }
      if (!allowOverdueOverride) {
        showWarning("Vui lòng tích chọn xác nhận ngoại lệ trả hàng quá hạn để tiếp tục.");
        return;
      }
    }

    if (activeItems.length === 0) {
      showError("Vui lòng chọn ít nhất một mặt hàng và nhập số lượng cần trả");
      return;
    }

    if (hasAnyItemError) {
      showError("Vui lòng kiểm tra lại số lượng trả không được vượt quá số lượng còn lại.");
      return;
    }

    try {
      const payload = {
        originalInvoiceId: selectedInvoiceId,
        reason: reason.trim() || undefined,
        refundPaymentMethod,
        allowOverdueOverride: isInvoiceExpired ? allowOverdueOverride : undefined,
        items: activeItems.map((it) => ({
          invoiceItemId: it.invoiceItemId,
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
        })),
      };

      const res = await createTicket(payload).unwrap();
      const created = res.result;

      showSuccess(`Lập phiếu trả hàng ${created?.ticketNumber || ""} thành công!`);
      if (created) onSuccess?.(created);
      onClose();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể lập phiếu trả hàng"));
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-sm animate-backdrop-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-ticket-title"
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-modal-smooth-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kv-blue-primary text-white shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="9 14 4 9 9 4" />
                <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
              </svg>
            </div>
            <div>
              <h2 id="create-ticket-title" className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-tight">
                Lập phiếu trả hàng từ hóa đơn đã cấp mã
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                Tuân thủ quy tắc QTN-18 (Hạn 7 ngày) & QTN-19 (Không vượt số lượng đã bán)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Wizard Bar */}
        <div className="flex items-center border-b border-slate-200 bg-white px-6 py-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                selectedInvoiceId ? "bg-emerald-500 text-white" : "bg-kv-blue-primary text-white"
              }`}
            >
              {selectedInvoiceId ? <Check size={13} /> : "1"}
            </span>
            <span className={selectedInvoiceId ? "text-slate-500 font-medium" : "text-kv-blue-primary font-black"}>
              Bước 1: Tra cứu / Chọn hóa đơn gốc
            </span>
          </div>

          <div className="mx-4 h-0.5 w-10 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                selectedInvoiceId ? "bg-kv-blue-primary text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              2
            </span>
            <span className={selectedInvoiceId ? "text-kv-blue-primary font-black" : "text-slate-400 font-medium"}>
              Bước 2: Chọn mặt hàng trả lại & Xác nhận
            </span>
          </div>
        </div>

        {/* Modal Form Content */}
        {!selectedInvoiceId ? (
          /* STEP 1: Full Invoice Table Picker */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex-1">
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-800">
                  Danh sách hóa đơn đã cấp mã đủ điều kiện trả hàng
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hệ thống tự động lọc các hóa đơn ở trạng thái <strong>ĐÃ CẤP MÃ (ISSUED)</strong> theo đúng quy tắc QTN-18.
                </p>
              </div>

              {/* Search Bar Input */}
              <div className="relative min-w-[280px] sm:min-w-[320px]">
                <Search size={14} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  placeholder="Tìm theo số HĐ, khách hàng, mã tra cứu..."
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 focus:border-kv-blue-primary focus:outline-none"
                />
                {invoiceSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setInvoiceSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Invoices List Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white flex-1 min-h-[300px]">
              <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                    <th className="p-3">Số hóa đơn</th>
                    <th className="p-3">Mã tra cứu</th>
                    <th className="p-3">Khách hàng</th>
                    <th className="p-3">Ngày phát hành</th>
                    <th className="p-3 text-center">Trạng thái</th>
                    <th className="p-3 text-right">Tổng tiền</th>
                    <th className="p-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {isLoadingInvoices ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-kv-blue-primary" />
                          <span>Đang tải danh sách hóa đơn đã cấp mã...</span>
                        </div>
                      </td>
                    </tr>
                  ) : eligibleInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="text-xs font-semibold text-slate-600">
                            Không tìm thấy hóa đơn đã cấp mã nào phù hợp với điều kiện tìm kiếm.
                          </p>
                          <p className="text-[11px] text-slate-400 max-w-md">
                            Lưu ý: Chỉ những hóa đơn đã phát hành và được cơ quan thuế cấp mã (ISSUED/ADJUSTED) mới được phép lập phiếu trả hàng.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    eligibleInvoices.map((inv: IInvoice) => {
                      const invAmount = inv.finalAmount || inv.amount || 0;
                      const invDate = inv.createdAt || inv.time;
                      let daysPassed = 0;
                      if (invDate) {
                        const diffMs = Date.now() - new Date(invDate).getTime();
                        daysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      }
                      const isOverdue = daysPassed > 7;

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-kv-blue-primary/5 transition-colors cursor-pointer"
                          onClick={() => setSelectedInvoiceId(inv.id)}
                        >
                          <td className="p-3 font-mono font-bold text-kv-blue-primary text-xs">
                            {inv.invoiceNumber || inv.id}
                          </td>
                          <td className="p-3 font-mono text-slate-500 text-[11px]">
                            {inv.lookupCode || "—"}
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {inv.buyerName || inv.customer || "Khách mua lẻ"}
                          </td>
                          <td className="p-3 text-slate-500 font-medium text-[11px]">
                            <div>{invDate ? new Date(invDate).toLocaleDateString("vi-VN") : "N/A"}</div>
                            <span
                              className={`inline-block text-[10px] font-bold ${
                                isOverdue ? "text-amber-600" : "text-emerald-600"
                              }`}
                            >
                              {isOverdue ? `Đã quá hạn (${daysPassed} ngày)` : `Trong hạn (${daysPassed}/7 ngày)`}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200">
                              {inv.status === "ADJUSTED" ? "ĐÃ ĐIỀU CHỈNH" : "ĐÃ CẤP MÃ"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            {formatCurrency(invAmount)}
                          </td>
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceId(inv.id)}
                              className="flex items-center gap-1 mx-auto rounded-lg bg-kv-blue-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-kv-blue-dark transition-all shadow-sm active:scale-95"
                            >
                              <span>Chọn hóa đơn</span>
                              <ArrowRight size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Step 1 */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">
                Tìm thấy <strong>{eligibleInvoices.length}</strong> hóa đơn đủ điều kiện
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Đóng / Hủy bỏ
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: Product Items Selection & Refund Amount Form */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">
            {/* Selected Invoice Info Card */}
            <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-kv-blue-primary text-white text-[10px]">
                    1
                  </span>
                  Hóa đơn gốc đã chọn
                </span>
                {!initialInvoiceId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvoiceId("");
                      setSelectedItems([]);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-kv-blue-primary hover:text-kv-blue-dark transition-colors"
                  >
                    <ArrowLeft size={13} />
                    Chọn lại hóa đơn khác
                  </button>
                )}
              </div>

              {isChecking ? (
                <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-500 font-bold">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-kv-blue-primary" />
                  Đang kiểm tra và tải dữ liệu hóa đơn...
                </div>
              ) : checkData ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Mã số hóa đơn:</span>
                    <strong className="font-mono text-kv-blue-primary text-sm font-bold">
                      {checkData.invoiceNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Khách hàng / Người mua:</span>
                    <strong className="text-slate-800">{checkData.buyerName || "Khách lẻ"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Ngày phát hành:</span>
                    <span className="text-slate-700 font-semibold">
                      {checkData.invoiceDate ? new Date(checkData.invoiceDate).toLocaleDateString("vi-VN") : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Thời hạn quy định:</span>
                    <span
                      className={`font-bold ${
                        isInvoiceExpired ? "text-rose-600 font-extrabold" : "text-emerald-600"
                      }`}
                    >
                      {checkData.daysSinceIssued} ngày / tối đa {checkData.maxReturnDays} ngày
                    </span>
                  </div>
                </div>
              ) : isCheckError ? (
                <div className="text-xs text-rose-600 font-bold">Không tìm thấy dữ liệu hóa đơn gốc.</div>
              ) : null}
            </div>

            {/* Overdue Warning & Business Rule Banner (QTN-18) */}
            {isInvoiceExpired && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-xs shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-900 mt-0.5">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <h4 className="font-extrabold text-amber-950 uppercase text-[11px]">
                      Cảnh báo: Hóa đơn đã quá hạn trả hàng ({checkData?.daysSinceIssued} ngày &gt; {checkData?.maxReturnDays} ngày quy định)
                    </h4>
                    {isOwner ? (
                      <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allowOverdueOverride}
                          onChange={(e) => setAllowOverdueOverride(e.target.checked)}
                          className="h-4 w-4 rounded border-amber-400 text-amber-700 focus:ring-amber-500"
                        />
                        <span className="font-bold text-amber-900">
                          (Chủ hộ xác nhận) Cho phép trả hàng ngoại lệ theo quy tắc QTN-18
                        </span>
                      </label>
                    ) : (
                      <p className="font-semibold text-rose-700 flex items-center gap-1">
                        <ShieldAlert size={14} />
                        Thu ngân không có quyền duyệt ngoại lệ. Vui lòng nhờ Chủ hộ (Owner) xử lý.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 Table: Items on Invoice */}
            {checkData && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-kv-blue-primary text-white text-[10px]">
                      2
                    </span>
                    Chọn các mặt hàng khách trả lại & Số lượng (QTN-19) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Đã chọn: <strong className="text-kv-blue-primary">{activeItems.length}</strong> mặt hàng
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                        <th className="p-3 text-center w-10">Chọn</th>
                        <th className="p-3 min-w-[180px]">Mặt hàng</th>
                        <th className="p-3 text-center w-14">ĐVT</th>
                        <th className="p-3 text-right w-20">Đã mua</th>
                        <th className="p-3 text-right w-20">Đã trả</th>
                        <th className="p-3 text-right w-24 text-kv-blue-primary">Còn được trả</th>
                        <th className="p-3 text-center w-28">SL trả lại *</th>
                        <th className="p-3 text-right w-24">Đơn giá</th>
                        <th className="p-3 text-right w-28">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {selectedItems.map((item, idx) => {
                        const isDisabled = item.returnableQuantity <= 0;
                        const lineTotal = item.isSelected ? item.quantity * item.unitPrice : 0;

                        return (
                          <tr
                            key={item.invoiceItemId}
                            className={`${isDisabled ? "bg-slate-50/70 opacity-60" : item.isSelected ? "bg-kv-blue-primary/5" : "hover:bg-slate-50/50"}`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                disabled={isDisabled}
                                checked={item.isSelected}
                                onChange={() => handleToggleItem(idx)}
                                className="h-4 w-4 rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary disabled:opacity-40"
                              />
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-800 block">{item.productName}</span>
                              {item.error && (
                                <span className="text-rose-600 text-[10px] font-bold block mt-0.5 animate-pulse">
                                  {item.error}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">{item.unit}</td>
                            <td className="p-3 text-right font-mono text-slate-600">
                              {formatNumber(checkData.items[idx]?.boughtQuantity || 0)}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-400">
                              {formatNumber(checkData.items[idx]?.alreadyReturnedQuantity || 0)}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-kv-blue-primary">
                              {formatNumber(item.returnableQuantity)}
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                step="1"
                                min="1"
                                max={item.returnableQuantity}
                                disabled={!item.isSelected || isDisabled}
                                value={item.quantity || ""}
                                onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                className={`w-20 rounded-lg border px-2 py-1 text-center text-xs font-bold focus:outline-none ${
                                  item.error
                                    ? "border-rose-500 bg-rose-50 text-rose-700 focus:border-rose-600"
                                    : "border-slate-300 text-slate-800 focus:border-kv-blue-primary"
                                } disabled:opacity-40`}
                              />
                            </td>
                            <td className="p-3 text-right text-slate-600 font-medium">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              {formatCurrency(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step 3: Payment Method & Reason */}
            {selectedItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Bước 3: Phương thức hoàn tiền cho khách <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {REFUND_PAYMENT_METHOD_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer text-xs font-bold transition-all ${
                          refundPaymentMethod === opt.value
                            ? "border-kv-blue-primary bg-kv-blue-primary/5 text-kv-blue-primary shadow-sm"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="refundMethod"
                          value={opt.value}
                          checked={refundPaymentMethod === opt.value}
                          onChange={() => setRefundPaymentMethod(opt.value)}
                          className="text-kv-blue-primary focus:ring-kv-blue-primary"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Lý do trả hàng
                  </label>
                  <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ghi chú lý do trả hàng (ví dụ: Khách đổi ý, hàng bị lỗi bao bì, giao thừa số lượng...)"
                    className="w-full rounded-xl border border-slate-300 p-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-kv-blue-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Live Summary Box */}
            {activeItems.length > 0 && (
              <div className="ml-auto w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-2 text-xs font-bold text-slate-700 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cộng tiền hàng trả lại:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(totalBeforeTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thuế GTGT hoàn lại:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(totalTaxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm text-slate-950 font-black">
                  <span>TỔNG TIỀN HOÀN TRẢ KHÁCH:</span>
                  <span className="text-rose-600 font-black text-base">{formatCurrency(totalRefundAmount)}</span>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedInvoiceId("");
                  setSelectedItems([]);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={14} />
                Quay lại chọn hóa đơn khác
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-kv-blue-primary px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-kv-blue-primary/30 hover:bg-kv-blue-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed min-w-[200px]"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Đang tạo phiếu...
                    </>
                  ) : (
                    "XÁC NHẬN LẬP PHIẾU TRẢ HÀNG"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
