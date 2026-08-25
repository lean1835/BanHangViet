import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Wallet,
  ShieldAlert,
} from "lucide-react";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";
import { useDebounce } from "@/hooks/useDebounce";
import { APP_ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import {
  REFUND_PAYMENT_METHODS,
  REFUND_PAYMENT_METHOD_OPTIONS,
  type TRefundPaymentMethod,
} from "@/constants/returnTicket";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { STORAGE_KEYS } from "@/constants/app";
import {
  useLazyCheckInvoiceReturnableQuery,
  useCreateReturnTicketMutation,
} from "../services/returnTicketApi";
import { useGetInvoicesQuery } from "@/modules/e_invoice/services/eInvoiceApi";
import type { IReturnableItemDto } from "../types/IReturnTicket";
import type { IInvoice, IInvoiceItem } from "@/modules/e_invoice/types/IInvoice";

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

export const CreateReturnTicketPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialInvoiceId = searchParams.get("invoiceId") || undefined;
  const { currentRole, addLogEntry } = useDashboardDemo();
  const { showSuccess, showError, showWarning } = useNotification();
  const isOwner = currentRole === USER_ROLES.OWNER;

  // Selected Invoice & Search State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(initialInvoiceId || "");
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>("");
  const debouncedInvoiceSearch = useDebounce(invoiceSearchQuery, 300);

  // Items & Refund Settings State
  const [selectedItems, setSelectedItems] = useState<SelectedReturnItem[]>([]);
  const [refundPaymentMethod, setRefundPaymentMethod] = useState<TRefundPaymentMethod>(
    REFUND_PAYMENT_METHODS.CASH
  );
  const [reason, setReason] = useState<string>("");
  const [allowOverdueOverride, setAllowOverdueOverride] = useState<boolean>(false);

  // Queries & Mutations
  const [checkInvoice, { data: checkResponse, isLoading: isChecking }] =
    useLazyCheckInvoiceReturnableQuery();

  const { data: invoicesData, isLoading: isLoadingInvoices } = useGetInvoicesQuery({
    status: "ISSUED",
    search: debouncedInvoiceSearch.trim() || undefined,
    page: 0,
    size: 100,
  });

  const [createTicket, { isLoading: isSubmitting }] = useCreateReturnTicketMutation();

  // Combine API invoices with local cached invoices for offline/mock data support
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

    return allList.filter((inv: IInvoice) => {
      const isIssued = inv.status === "ISSUED";
      if (!isIssued) return false;

      if (!debouncedInvoiceSearch.trim()) return true;
      const q = debouncedInvoiceSearch.trim().toLowerCase();
      const numMatch = (inv.invoiceNumber || "").toLowerCase().includes(q);
      const codeMatch = (inv.lookupCode || "").toLowerCase().includes(q);
      const nameMatch = (inv.buyerName || inv.customer || "").toLowerCase().includes(q);
      const phoneMatch = (inv.buyerPhone || "").toLowerCase().includes(q);
      return numMatch || codeMatch || nameMatch || phoneMatch;
    });
  }, [invoicesData, debouncedInvoiceSearch]);

  // Selected invoice object
  const selectedInvoice = useMemo(() => {
    if (!selectedInvoiceId) return null;
    return eligibleInvoices.find((i) => i.id === selectedInvoiceId) || null;
  }, [eligibleInvoices, selectedInvoiceId]);

  // Sync initialInvoiceId
  useEffect(() => {
    if (initialInvoiceId) {
      setSelectedInvoiceId(initialInvoiceId);
    }
  }, [initialInvoiceId]);

  // Trigger checkInvoice when selectedInvoiceId changes
  useEffect(() => {
    if (selectedInvoiceId) {
      checkInvoice(selectedInvoiceId);
    }
  }, [selectedInvoiceId, checkInvoice]);

  // Populate selected items when checkResponse arrives or from local invoice
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
        const items: SelectedReturnItem[] = currentInv.items.map((it: IInvoiceItem, idx: number) => {
          const qty = Number(it.quantity) || 1;
          return {
            invoiceItemId: it.id || `item_${idx}`,
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

  const handleQuantityChange = (index: number, valStr: string) => {
    const parsed = parseInt(valStr, 10);
    const num = isNaN(parsed) ? 0 : parsed;

    setSelectedItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      target.quantity = num;

      if (num <= 0) {
        target.error = "Số lượng trả phải lớn hơn 0";
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
    Boolean(selectedInvoiceId) &&
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
          unitPrice: it.unitPrice,
          taxRatePercentage: it.taxRatePercentage,
        })),
      };

      const res = await createTicket(payload).unwrap();
      const createdTicket = res?.result;

      addLogEntry(
        "Lập phiếu trả hàng",
        `Lập phiếu trả hàng ${createdTicket?.ticketNumber || ""} cho hóa đơn ${
          selectedInvoice?.invoiceNumber || selectedInvoiceId
        }. Tổng hoàn: ${formatCurrency(totalRefundAmount)}`
      );

      showSuccess("Đã lập phiếu trả hàng và gửi duyệt thành công!");
      navigate(APP_ROUTES.RETURN_TICKETS);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể lập phiếu trả hàng trên hệ thống."));
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full overflow-y-auto bg-slate-50">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 sm:p-6 pb-24 animate-page-enter">
        {/* Top Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 bg-white p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.RETURN_TICKETS)}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 active:scale-95 rounded-lg text-slate-700 text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <ArrowLeft size={16} />
              <span>Quay lại danh sách</span>
            </button>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                Lập phiếu trả hàng
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tạo phiếu hoàn trả sản phẩm từ hóa đơn bán hàng và thực hiện hoàn tiền cho khách
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Section 1: Hóa đơn gốc */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 text-kv-blue-primary rounded-lg">
                  <Receipt size={18} />
                </div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  1. Hóa đơn gốc cần trả hàng
                </h2>
              </div>
              {selectedInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoiceId("");
                    setSelectedItems([]);
                  }}
                  className="text-xs font-bold text-kv-blue-primary hover:underline"
                >
                  Chọn hóa đơn khác
                </button>
              )}
            </div>

            {selectedInvoice ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Số hóa đơn / Ký hiệu:</span>
                  <span className="font-bold text-slate-800 text-sm font-mono">
                    {selectedInvoice.invoiceNumber || "Chưa cấp số"} ({selectedInvoice.invoiceSymbol || selectedInvoice.symbol})
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                    Mã tra cứu: {selectedInvoice.lookupCode}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Khách hàng:</span>
                  <span className="font-bold text-slate-800">
                    {selectedInvoice.buyerName || selectedInvoice.customer || "Khách lẻ"}
                  </span>
                  {selectedInvoice.buyerPhone && (
                    <span className="text-slate-500 block text-[11px]">
                      SĐT: {selectedInvoice.buyerPhone}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Tổng giá trị hóa đơn:</span>
                  <span className="font-extrabold text-kv-blue-primary text-sm">
                    {formatCurrency(selectedInvoice.finalAmount)}
                  </span>
                  <span className="text-slate-500 block text-[11px]">
                    Ngày lập: {formatDate(selectedInvoice.createdAt || selectedInvoice.time)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    placeholder="Tìm theo số hóa đơn, mã tra cứu, tên khách hàng hoặc số điện thoại..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-kv-blue-primary focus:outline-none transition-all"
                  />
                </div>

                {isLoadingInvoices ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Đang tải danh sách hóa đơn đủ điều kiện trả hàng...
                  </div>
                ) : eligibleInvoices.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Không tìm thấy hóa đơn đã cấp mã nào phù hợp.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                    {eligibleInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="p-3 hover:bg-sky-50/70 cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">
                              {inv.invoiceNumber || "Hóa đơn"} - {inv.lookupCode}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Đã cấp mã
                            </span>
                          </div>
                          <p className="text-slate-500 font-medium text-[11px] mt-0.5">
                            Khách hàng: {inv.buyerName || inv.customer || "Khách lẻ"} •{" "}
                            {formatDate(inv.createdAt || inv.time)}
                          </p>
                        </div>
                        <span className="font-extrabold text-kv-blue-primary">
                          {formatCurrency(inv.finalAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Overdue Warning Alert */}
            {isInvoiceExpired && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                  <span>Hóa đơn này đã quá thời hạn trả hàng tiêu chuẩn (7 ngày)!</span>
                </div>
                <p className="text-amber-700 text-[11px] leading-relaxed">
                  {isOwner
                    ? "Bạn đang đăng nhập với quyền Chủ hộ. Bạn có thể chấp thuận ngoại lệ để tiếp tục lập phiếu trả hàng này."
                    : "Chỉ tài khoản Chủ hộ kinh doanh mới có thẩm quyền phê duyệt trả hàng quá hạn 7 ngày."}
                </p>

                {isOwner && (
                  <label className="flex items-center gap-2 pt-1 cursor-pointer font-bold text-slate-800 text-xs select-none">
                    <input
                      type="checkbox"
                      checked={allowOverdueOverride}
                      onChange={(e) => setAllowOverdueOverride(e.target.checked)}
                      className="w-4 h-4 rounded border-amber-300 text-kv-blue-primary focus:ring-kv-blue-primary"
                    />
                    <span>Xác nhận chấp thuận ngoại lệ trả hàng quá thời hạn 7 ngày</span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Chọn sản phẩm trả lại */}
          {selectedInvoiceId && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-50 text-kv-blue-primary rounded-lg">
                    <RotateCcw size={18} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    2. Danh sách sản phẩm trả lại
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Đã chọn: <strong className="text-kv-blue-primary">{activeItems.length}</strong> mặt hàng
                </span>
              </div>

              {isChecking ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Đang kiểm tra số lượng còn được phép trả của hóa đơn...
                </div>
              ) : selectedItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  Hóa đơn này không còn mặt hàng nào đủ điều kiện trả lại (đã trả hết).
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                        <th className="p-3 w-10 text-center">Chọn</th>
                        <th className="p-3">Tên sản phẩm</th>
                        <th className="p-3">ĐVT</th>
                        <th className="p-3 text-right">Đơn giá hoàn</th>
                        <th className="p-3 text-center">Được trả</th>
                        <th className="p-3 text-center w-28">SL trả lại</th>
                        <th className="p-3 text-right">Thuế %</th>
                        <th className="p-3 text-right">Thành tiền hoàn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {selectedItems.map((item, index) => {
                        const itemTotal =
                          item.quantity *
                          item.unitPrice *
                          (1 + item.taxRatePercentage / 100);

                        return (
                          <tr
                            key={item.invoiceItemId}
                            className={`transition-colors ${
                              item.isSelected ? "bg-sky-50/30" : "opacity-60"
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={item.isSelected}
                                disabled={item.returnableQuantity <= 0}
                                onChange={() => handleToggleItem(index)}
                                className="w-4 h-4 rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-bold text-slate-800">
                              {item.productName}
                              {item.error && (
                                <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                                  {item.error}
                                </p>
                              )}
                            </td>
                            <td className="p-3 text-slate-500">{item.unit}</td>
                            <td className="p-3 text-right font-medium">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="p-3 text-center font-bold text-slate-600">
                              {item.returnableQuantity}
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min={1}
                                max={item.returnableQuantity}
                                value={item.quantity}
                                disabled={!item.isSelected || item.returnableQuantity <= 0}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                className={`w-20 px-2.5 py-1 text-center font-bold text-xs rounded-lg border focus:outline-none transition-all ${
                                  item.error
                                    ? "border-rose-400 bg-rose-50 text-rose-700"
                                    : "border-slate-300 bg-white text-slate-800 focus:border-kv-blue-primary"
                                }`}
                              />
                            </td>
                            <td className="p-3 text-right text-slate-500">
                              {item.taxRatePercentage}%
                            </td>
                            <td className="p-3 text-right font-bold text-kv-blue-primary">
                              {item.isSelected && item.quantity > 0
                                ? formatCurrency(itemTotal)
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Phương thức & Lý do hoàn tiền */}
          {selectedInvoiceId && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-1.5 bg-sky-50 text-kv-blue-primary rounded-lg">
                  <Wallet size={18} />
                </div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  3. Hình thức hoàn tiền & Lý do trả hàng
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hình thức hoàn tiền cho khách <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {REFUND_PAYMENT_METHOD_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRefundPaymentMethod(opt.value)}
                        className={`px-3 py-2.5 rounded-lg text-xs font-bold border transition-all text-center ${
                          refundPaymentMethod === opt.value
                            ? "border-kv-blue-primary bg-sky-50 text-kv-blue-primary shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Lý do hoàn trả hàng
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ví dụ: Sản phẩm lỗi bao bì, khách đổi ý, sai quy cách..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-kv-blue-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Summary calculation card */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs text-slate-600">
                  <p>
                    Tiền hàng trước thuế:{" "}
                    <strong className="text-slate-800 font-bold font-mono">
                      {formatCurrency(totalBeforeTax)}
                    </strong>
                  </p>
                  <p>
                    Tiền thuế VAT hoàn trả:{" "}
                    <strong className="text-slate-800 font-bold font-mono">
                      {formatCurrency(totalTaxAmount)}
                    </strong>
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs text-slate-500 font-bold block">
                    Tổng tiền hoàn trả khách:
                  </span>
                  <span className="text-xl font-black text-rose-600 font-mono tracking-tight">
                    {formatCurrency(totalRefundAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.RETURN_TICKETS)}
              className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? "Đang xử lý..." : "Xác nhận tạo phiếu trả hàng"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReturnTicketPage;
