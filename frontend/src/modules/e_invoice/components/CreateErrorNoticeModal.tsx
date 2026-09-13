import React, { useState, useEffect } from "react";
import { X, AlertCircle, FileText, CheckCircle2, Send, Save } from "lucide-react";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import type { IInvoice } from "../types/IInvoice";
import type { TNoticeHandlingType } from "../types/IInvoiceErrorNotice";
import {
  useGetEligibleInvoicesQuery,
  useCreateErrorNoticeMutation,
  useSendErrorNoticeToTaxMutation,
} from "../services/invoiceErrorNoticeApi";

interface SelectedInvoiceItemState {
  invoiceId: string;
  handlingType: TNoticeHandlingType;
  reason: string;
}

interface CreateErrorNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedInvoiceId?: string;
}

export const CreateErrorNoticeModal: React.FC<CreateErrorNoticeModalProps> = ({
  isOpen,
  onClose,
  preSelectedInvoiceId,
}) => {
  const { showError, showSuccess } = useNotification();

  const {
    data: eligibleResponse,
    isLoading: isLoadingEligible,
    refetch: refetchEligible,
  } = useGetEligibleInvoicesQuery(undefined, {
    skip: !isOpen,
  });

  const eligibleInvoices: IInvoice[] = eligibleResponse?.result || [];

  const [createNoticeApi, { isLoading: isCreating }] = useCreateErrorNoticeMutation();
  const [sendNoticeApi, { isLoading: isSending }] = useSendErrorNoticeToTaxMutation();

  const [noticePlace, setNoticePlace] = useState("TP. Hồ Chí Minh");
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedInvoiceItemState>>(
    new Map()
  );
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      refetchEligible();
      setFormErrors({});
      if (preSelectedInvoiceId) {
        const defaultHandling: TNoticeHandlingType = "CANCEL";
        setSelectedItems(
          new Map([
            [
              preSelectedInvoiceId,
              {
                invoiceId: preSelectedInvoiceId,
                handlingType: defaultHandling,
                reason: "",
              },
            ],
          ])
        );
      } else {
        setSelectedItems(new Map());
      }
    }
  }, [isOpen, preSelectedInvoiceId, refetchEligible]);

  if (!isOpen) return null;

  const handleToggleInvoice = (inv: IInvoice) => {
    const next = new Map(selectedItems);
    if (next.has(inv.id)) {
      next.delete(inv.id);
    } else {
      const defaultHandling: TNoticeHandlingType =
        inv.status === "ADJUSTED" ? "ADJUST" : "CANCEL";
      next.set(inv.id, {
        invoiceId: inv.id,
        handlingType: defaultHandling,
        reason:
          inv.cancelReason ||
          (inv.status === "CANCELED"
            ? "Hủy bỏ hóa đơn điện tử có sai sót theo thỏa thuận người mua"
            : "Điều chỉnh sai sót thông tin giá trị và thuế suất hóa đơn"),
      });
    }
    setSelectedItems(next);
  };

  const handleUpdateItem = (
    invoiceId: string,
    field: "handlingType" | "reason",
    value: string
  ) => {
    const next = new Map(selectedItems);
    const existing = next.get(invoiceId);
    if (existing) {
      next.set(invoiceId, {
        ...existing,
        [field]: value,
      });
      setSelectedItems(next);
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (selectedItems.size === 0) {
      errors.general = "Vui lòng chọn ít nhất một hóa đơn để lập thông báo sai sót.";
    }

    selectedItems.forEach((item, id) => {
      if (!item.reason || item.reason.trim().length < 10) {
        errors[id] = "Lý do sai sót bắt buộc phải từ 10 ký tự trở lên.";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (sendImmediately: boolean) => {
    if (!validateForm()) return;

    try {
      const itemsPayload = Array.from(selectedItems.values()).map((it) => ({
        invoiceId: it.invoiceId,
        handlingType: it.handlingType,
        reason: it.reason.trim(),
      }));

      const created = await createNoticeApi({
        noticePlace: noticePlace.trim() || "TP. Hồ Chí Minh",
        items: itemsPayload,
      }).unwrap();

      const noticeId = created.result.id;

      if (sendImmediately && noticeId) {
        await sendNoticeApi(noticeId).unwrap();
        showSuccess(
          `Đã lập và gửi Thông báo sai sót tới Cơ quan Thuế thành công! (Mã: ${created.result.noticeCode})`
        );
      } else {
        showSuccess(
          `Đã lưu Thông báo sai sót ở dạng Nháp thành công! (Mã: ${created.result.noticeCode})`
        );
      }

      onClose();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể khởi tạo thông báo sai sót."));
    }
  };

  const isSubmitting = isCreating || isSending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-kv-orange-accent flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">
                Lập thông báo hóa đơn điện tử có sai sót
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Theo Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC gửi Cơ quan Thuế
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {formErrors.general && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{formErrors.general}</span>
            </div>
          )}

          {/* Place of notice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa điểm lập thông báo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={noticePlace}
                onChange={(e) => setNoticePlace(e.target.value)}
                placeholder="Ví dụ: TP. Hồ Chí Minh, Hà Nội..."
                className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-kv-blue-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cơ quan thuế tiếp nhận
              </label>
              <input
                type="text"
                readOnly
                value="Cơ quan Thuế quản lý trực tiếp"
                className="w-full h-9 px-3 border border-slate-200 bg-slate-100/80 rounded-lg text-xs font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Invoices Selection List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                Hóa đơn sai sót cần thông báo ({selectedItems.size} đã chọn)
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                (Chỉ các HĐ đã Hủy hoặc Điều chỉnh chưa được CQT tiếp nhận)
              </span>
            </div>

            {isLoadingEligible ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium bg-slate-50 rounded-xl border border-slate-200">
                Đang nạp danh sách hóa đơn đủ điều kiện...
              </div>
            ) : eligibleInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  Hiện không có hóa đơn Hủy hoặc Điều chỉnh nào cần lập thông báo sai sót.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tất cả hóa đơn đã hủy/điều chỉnh đều đã được tiếp nhận thông báo sai sót.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {eligibleInvoices.map((inv) => {
                  const isChecked = selectedItems.has(inv.id);
                  const itemState = selectedItems.get(inv.id);
                  const errorMsg = formErrors[inv.id];

                  return (
                    <div
                      key={inv.id}
                      className={`p-4 transition-colors ${
                        isChecked ? "bg-blue-50/40" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={`chk-${inv.id}`}
                          checked={isChecked}
                          onChange={() => handleToggleInvoice(inv)}
                          className="mt-1 w-4 h-4 rounded text-kv-blue-primary border-slate-300 focus:ring-kv-blue-primary cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <label
                              htmlFor={`chk-${inv.id}`}
                              className="font-mono font-extrabold text-xs text-slate-900 cursor-pointer"
                            >
                              Số HĐ: {inv.invoiceNumber || "Chưa cấp số"} ({inv.invoiceSymbol || inv.symbol})
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {inv.status === "CANCELED" ? "Đã hủy" : "Đã điều chỉnh"}
                              </span>
                              <span className="text-xs font-bold text-kv-blue-primary">
                                {formatCurrency(inv.finalAmount)}
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-4 flex-wrap">
                            <span>Khách: <strong>{inv.buyerName || inv.customer || "-"}</strong></span>
                            <span>Mã tra cứu: <strong className="font-mono">{inv.lookupCode}</strong></span>
                            <span>Ngày: {formatDate(inv.createdAt || inv.time)}</span>
                          </div>

                          {/* Expanded Configuration for Selected Invoice */}
                          {isChecked && itemState && (
                            <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                  Tính chất thông báo sai sót
                                </label>
                                <select
                                  value={itemState.handlingType}
                                  onChange={(e) =>
                                    handleUpdateItem(
                                      inv.id,
                                      "handlingType",
                                      e.target.value as TNoticeHandlingType
                                    )
                                  }
                                  className="w-full h-8 px-2 border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:border-kv-blue-primary bg-white"
                                >
                                  <option value="CANCEL">1. Hủy (HĐ đã hủy)</option>
                                  <option value="ADJUST">2. Điều chỉnh</option>
                                  <option value="REPLACE">3. Thay thế</option>
                                  <option value="EXPLAIN">4. Giải trình sai sót</option>
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                  Lý do sai sót (Tối thiểu 10 ký tự) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={itemState.reason}
                                  onChange={(e) =>
                                    handleUpdateItem(inv.id, "reason", e.target.value)
                                  }
                                  placeholder="Nhập lý do sai sót theo quy định..."
                                  className={`w-full h-8 px-2 border rounded text-xs font-medium focus:outline-none focus:border-kv-blue-primary ${
                                    errorMsg ? "border-red-500 bg-red-50/30" : "border-slate-300"
                                  }`}
                                />
                                {errorMsg && (
                                  <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">
                                    {errorMsg}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition"
          >
            Đóng
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || selectedItems.size === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg transition disabled:opacity-50 shadow-sm"
            >
              <Save className="w-3.5 h-3.5 text-slate-600" />
              <span>{isCreating ? "Đang lưu..." : "Lưu bản nháp"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || selectedItems.size === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-kv-blue-primary hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg transition shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? "Đang gửi CQT..." : "Lưu & Gửi Cơ quan Thuế"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
