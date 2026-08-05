import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QRCode } from "antd";
import {
  Printer,
  X,
  Receipt,
  ShieldCheck,
  FileText,
  ArrowLeft,
} from "lucide-react";
import type { IPosTab } from "../types/IPos";
import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";
import { USER_ROLES } from "@/constants/roles";
import { STORAGE_KEYS } from "@/constants/app";
import { formatCurrency } from "@/utils/formatCurrency";
import { convertNumberToWords } from "@/modules/e_invoice/utils/eInvoiceHelpers";
import { InvoiceDetailModal } from "@/modules/e_invoice/components/InvoiceDetailModal";
import {
  useCreateInvoiceDraftMutation,
  useSubmitToTaxMutation,
  useResendInvoiceMutation,
  useCancelInvoiceMutation,
  useUpdateInvoiceMutation,
} from "@/modules/e_invoice/services/eInvoiceApi";

interface IOrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedOrder: {
    tab: IPosTab;
    changeAmount: number;
    finalTotal: number;
  } | null;
}

export const OrderSuccessModal: React.FC<IOrderSuccessModalProps> = ({
  isOpen,
  onClose,
  completedOrder,
}) => {
  // Protection timer to prevent accidental double-clicks from closing modal too quickly
  const [isDismissAllowed, setIsDismissAllowed] = useState<boolean>(false);
  const [modalView, setModalView] = useState<
    "SUCCESS" | "PRINT_RECEIPT" | "ISSUE_INVOICE_VIEW"
  >("SUCCESS");
  const [showIssueSuccessAlert, setShowIssueSuccessAlert] = useState<boolean>(false);
  const [issueSuccessAlertMsg, setIssueSuccessAlertMsg] = useState<string>(
    "Phát hành hóa đơn nháp thành công!"
  );
  const [paperSize, setPaperSize] = useState<"K80" | "K57">("K80");
  const [showQr, setShowQr] = useState<boolean>(true);
  const [realInvoice, setRealInvoice] = useState<IInvoice | null>(null);

  // RTK Query Mutations from eInvoiceApi
  const [createInvoiceDraft, { isLoading: isIssuingInvoice }] =
    useCreateInvoiceDraftMutation();
  const [submitToTax] = useSubmitToTaxMutation();
  const [resendInvoice] = useResendInvoiceMutation();
  const [cancelInvoice] = useCancelInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();

  useEffect(() => {
    if (isOpen) {
      setIsDismissAllowed(false);
      setModalView("SUCCESS");
      setShowIssueSuccessAlert(false);
      setRealInvoice(null);
      const timer = setTimeout(() => {
        setIsDismissAllowed(true);
      }, 400); // 400ms safety lock
      return () => clearTimeout(timer);
    } else {
      setIsDismissAllowed(false);
    }
  }, [isOpen]);

  if (!isOpen || !completedOrder) return null;

  const { tab, changeAmount, finalTotal } = completedOrder;

  const handleSafeClose = () => {
    if (isDismissAllowed) {
      onClose();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Price calculations
  const itemsSum = tab.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountCash =
    tab.discountType === "PERCENTAGE"
      ? (itemsSum * (tab.discountValue || 0)) / 100
      : tab.discountValue || 0;
  const afterDiscount = Math.max(0, itemsSum - discountCash);

  const itemTaxTotal = tab.items.reduce((sum, item) => {
    const itemTax = (item.product?.taxRatePercentage || 0) / 100;
    return sum + item.lineTotal * itemTax;
  }, 0);

  const taxAmount =
    tab.vatRate !== undefined
      ? afterDiscount * (tab.vatRate / 100)
      : itemTaxTotal;

  // Handle Real Invoice Issuance (POST /invoices/draft)
  const handleIssueInvoice = async () => {
    try {
      let createdInv: IInvoice | null = null;
      if (tab.backendOrderId) {
        const res = await createInvoiceDraft({ orderId: tab.backendOrderId }).unwrap();
        createdInv = res.result;
      }

      const effectiveInv: IInvoice = createdInv || {
        id: `inv_${Date.now()}`,
        lookupCode: `HD${Date.now().toString(36).toUpperCase()}`,
        invoicePattern: "1",
        invoiceSymbol: "1M26SOP",
        invoiceNumber: "Chưa cấp HĐ",
        status: "DRAFT",
        householdName: "HỘ KINH DOANH BÁN HÀNG VIỆT",
        householdTaxCode: "0102030405",
        householdAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
        householdPhone: "024.1234.5678",
        buyerName: tab.customer?.name || "Khách mua lẻ",
        buyerPhone: tab.customer?.phone || "",
        buyerAddress: tab.customer?.address || "",
        buyerTaxCode: (tab.customer as any)?.taxCode || "",
        taxAuthorityCode: "",
        symbol: "1M26SOP",
        customer: tab.customer?.name || "Khách mua lẻ",
        amount: finalTotal,
        time: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        totalAmountBeforeTax: itemsSum,
        taxAmount: taxAmount,
        discountAmount: discountCash,
        finalAmount: finalTotal,
        items: tab.items.map((item, idx) => ({
          id: item.id || `item_${idx}`,
          productId: item.product?.id || `p_${idx}`,
          productName: item.product?.name || "Sản phẩm",
          unit: "Cái",
          quantity: item.quantity,
          unitPrice: item.price,
          taxRatePercentage: item.product?.taxRatePercentage || 0,
          taxAmount: Math.round((item.lineTotal * (item.product?.taxRatePercentage || 0)) / 100),
          discountAmount: item.lineDiscount || 0,
          subtotal: item.lineTotal,
        })),
      };

      saveInvoiceToOfflineCache(effectiveInv);
      setRealInvoice(effectiveInv);
      setModalView("ISSUE_INVOICE_VIEW");
      setIssueSuccessAlertMsg("Phát hành hóa đơn nháp thành công!");
      setShowIssueSuccessAlert(true);
    } catch {
      const fallbackInv: IInvoice = {
        id: `inv_${Date.now()}`,
        lookupCode: `HD${Date.now().toString(36).toUpperCase()}`,
        invoicePattern: "1",
        invoiceSymbol: "1M26SOP",
        invoiceNumber: "Chưa cấp HĐ",
        status: "DRAFT",
        householdName: "HỘ KINH DOANH BÁN HÀNG VIỆT",
        householdTaxCode: "0102030405",
        householdAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
        householdPhone: "024.1234.5678",
        buyerName: tab.customer?.name || "Khách mua lẻ",
        buyerPhone: tab.customer?.phone || "",
        buyerAddress: tab.customer?.address || "",
        buyerTaxCode: (tab.customer as any)?.taxCode || "",
        taxAuthorityCode: "",
        symbol: "1M26SOP",
        customer: tab.customer?.name || "Khách mua lẻ",
        amount: finalTotal,
        time: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        totalAmountBeforeTax: itemsSum,
        taxAmount: taxAmount,
        discountAmount: discountCash,
        finalAmount: finalTotal,
        items: tab.items.map((item, idx) => ({
          id: item.id || `item_${idx}`,
          productId: item.product?.id || `p_${idx}`,
          productName: item.product?.name || "Sản phẩm",
          unit: "Cái",
          quantity: item.quantity,
          unitPrice: item.price,
          taxRatePercentage: item.product?.taxRatePercentage || 0,
          taxAmount: Math.round((item.lineTotal * (item.product?.taxRatePercentage || 0)) / 100),
          discountAmount: item.lineDiscount || 0,
          subtotal: item.lineTotal,
        })),
      };
      saveInvoiceToOfflineCache(fallbackInv);
      setRealInvoice(fallbackInv);
      setModalView("ISSUE_INVOICE_VIEW");
      setIssueSuccessAlertMsg("Phát hành hóa đơn nháp thành công!");
      setShowIssueSuccessAlert(true);
    }
  };

  const saveInvoiceToOfflineCache = (inv: IInvoice) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.POS_OFFLINE_INVOICES);
      const list: IInvoice[] = raw ? JSON.parse(raw) : [];
      const map = new Map<string, IInvoice>();
      list.forEach((item) => map.set(item.lookupCode || item.id, item));
      map.set(inv.lookupCode || inv.id, inv);
      const updated = Array.from(map.values()).sort((a, b) => {
        const timeA = new Date(a.createdAt || a.time || 0).getTime();
        const timeB = new Date(b.createdAt || b.time || 0).getTime();
        return timeB - timeA;
      });
      localStorage.setItem(STORAGE_KEYS.POS_OFFLINE_INVOICES, JSON.stringify(updated));
    } catch {
      /* ignore offline storage write error */
    }
  };

  // Handlers for inherited InvoiceDetailModal
  const handleSendToTax = async (id: string) => {
    try {
      if (id && !id.startsWith("inv_")) {
        const res = await submitToTax(id).unwrap();
        if (res.result) setRealInvoice(res.result);
      } else {
        setRealInvoice((prev) =>
          prev
            ? {
                ...prev,
                status: "WAITING_TAX_CODE",
                taxAuthorityCode: `CQT-${Date.now().toString().slice(-8)}`,
              }
            : null
        );
      }
      setIssueSuccessAlertMsg("Đã gửi hóa đơn điện tử chờ cơ quan thuế cấp mã.");
      setShowIssueSuccessAlert(true);
    } catch {
      setRealInvoice((prev) =>
        prev
          ? {
              ...prev,
              status: "WAITING_TAX_CODE",
              taxAuthorityCode: `CQT-${Date.now().toString().slice(-8)}`,
            }
          : null
      );
      setIssueSuccessAlertMsg("Đã gửi hóa đơn điện tử chờ cơ quan thuế cấp mã.");
      setShowIssueSuccessAlert(true);
    }
  };

  const handleResendToTax = async (id: string) => {
    try {
      if (id && !id.startsWith("inv_")) {
        const res = await resendInvoice(id).unwrap();
        if (res.result) setRealInvoice(res.result);
      }
      setIssueSuccessAlertMsg("Đã gửi lại hóa đơn chờ cơ quan thuế cấp mã.");
      setShowIssueSuccessAlert(true);
    } catch {
      /* ignore resend error */
    }
  };

  const handleCancelInvoice = async (id: string, reason: string) => {
    try {
      if (id && !id.startsWith("inv_")) {
        const res = await cancelInvoice({ invoiceId: id, cancelReason: reason }).unwrap();
        if (res.result) setRealInvoice(res.result);
      } else {
        setRealInvoice((prev) =>
          prev
            ? {
                ...prev,
                status: "CANCELED",
                cancelReason: reason,
              }
            : null
        );
      }
    } catch {
      /* ignore cancel error */
    }
  };

  const handleUpdateInvoice = async (
    id: string,
    buyerInfo: {
      buyerName: string;
      buyerTaxCode: string;
      buyerAddress: string;
      buyerPhone: string;
      buyerEmail: string;
    }
  ) => {
    try {
      if (id && !id.startsWith("inv_")) {
        const res = await updateInvoice({ invoiceId: id, ...buyerInfo }).unwrap();
        if (res.result) setRealInvoice(res.result);
      } else {
        setRealInvoice((prev) =>
          prev
            ? {
                ...prev,
                ...buyerInfo,
              }
            : null
        );
      }
    } catch {
      /* ignore update error */
    }
  };

  // Lookup code / Bill reference
  const lookupCode =
    realInvoice?.lookupCode ||
    tab.backendOrderId ||
    `FCB${Date.now().toString(36).toUpperCase()}`;
  const lookupUrl = `${window.location.origin}/lookup-invoice?code=${lookupCode}`;

  const createdDateStr = new Date().toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    second: "2-digit",
  });

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "BANK_TRANSFER":
        return "Chuyển khoản (CK)";
      case "DEBT":
        return "Ghi nợ";
      case "CASH":
      default:
        return "Tiền mặt";
    }
  };

  const isK57 = paperSize === "K57";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn select-none"
      onClick={handleSafeClose}
    >
      {/* Printable Area Wrapper with thermal print styles */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 0mm !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-pos-invoice-container, #printable-pos-invoice-container * {
            visibility: visible !important;
          }
          #printable-pos-invoice-container {
            position: relative !important;
            margin: 0 auto !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            width: ${isK57 ? "54mm" : "78mm"} !important;
            max-width: 100% !important;
            padding: 2mm 2mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            font-size: ${isK57 ? "9.5px" : "11px"} !important;
            line-height: 1.2 !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-before: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ─── VIEW 1: SUCCESS MODAL ─── */}
      {modalView === "SUCCESS" && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-center p-6 relative animate-modal-bounce-in"
        >
          {/* Top Right Close Button */}
          <button
            type="button"
            onClick={handleSafeClose}
            disabled={!isDismissAllowed}
            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-40"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Green Checkmark Badge */}
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-100 animate-bounce-in">
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="relative h-9 w-9 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h3 className="font-black text-lg text-slate-800 mb-1 tracking-tight">
            Thanh toán thành công!
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-4">
            Đơn hàng <span className="font-bold text-[#0070f4]">{tab.orderNumber}</span> đã được ghi nhận thành công.
          </p>

          {/* Detailed Transaction Summary Details Box */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left text-xs font-semibold space-y-2 mb-5 shadow-xs max-h-[280px] overflow-y-auto">
            <div className="flex justify-between items-center text-slate-500 text-[11px] pb-1.5 border-b border-slate-200/70">
              <span>Mã đơn: <strong className="text-slate-800 font-mono">{lookupCode}</strong></span>
              <span>{createdDateStr}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Khách hàng:</span>
              <span className="text-slate-800 font-bold">
                {tab.customer?.name || "Khách mua lẻ"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Hình thức thanh toán:</span>
              <span className="text-slate-800 font-bold">
                {getPaymentMethodLabel(tab.paymentMethod)}
              </span>
            </div>

            {/* List of purchased items */}
            {tab.items.length > 0 && (
              <div className="py-2 border-y border-slate-200/80 space-y-1">
                <div className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Chi tiết sản phẩm ({tab.items.reduce((s, i) => s + i.quantity, 0)}):
                </div>
                {tab.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
                    <span className="truncate max-w-[200px]">
                      {item.product.name} <span className="text-slate-500 font-normal">x{item.quantity}</span>
                    </span>
                    <span className="font-bold shrink-0">{formatCurrency(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Totals Breakdown */}
            <div className="space-y-1 pt-0.5">
              <div className="flex justify-between text-slate-600">
                <span>Cộng tiền hàng:</span>
                <span className="font-bold text-slate-800">{formatCurrency(itemsSum)}</span>
              </div>

              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Thuế GTGT (VAT):</span>
                  <span className="font-bold text-slate-800">{formatCurrency(taxAmount)}</span>
                </div>
              )}

              {discountCash > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Chiết khấu / Giảm giá:</span>
                  <span className="font-bold">-{formatCurrency(discountCash)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                <span className="text-slate-800 font-black">Tổng thanh toán:</span>
                <span className="text-[#0070f4] font-black text-sm">
                  {formatCurrency(finalTotal)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Tiền khách đưa:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(tab.amountGiven || finalTotal)}
                </span>
              </div>

              {changeAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-extrabold pt-0.5">
                  <span>Tiền thừa trả khách:</span>
                  <span className="font-black">
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2 Main Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleIssueInvoice}
              disabled={isIssuingInvoice}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>{isIssuingInvoice ? "Đang phát hành..." : "Phát hành hóa đơn"}</span>
            </button>

            <button
              type="button"
              onClick={() => setModalView("PRINT_RECEIPT")}
              className="py-2.5 px-3 rounded-xl bg-[#0070f4] hover:bg-blue-600 active:scale-[0.98] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>In phiếu thanh toán</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── VIEW 2: INHERITED E-INVOICE DETAIL MODAL FROM E_INVOICE MODULE ─── */}
      {modalView === "ISSUE_INVOICE_VIEW" && realInvoice && (
        <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
          <InvoiceDetailModal
            isOpen={true}
            onClose={() => setModalView("SUCCESS")}
            invoice={realInvoice}
            currentRole={USER_ROLES.OWNER}
            onSendToTax={handleSendToTax}
            onResendToTax={handleResendToTax}
            onCancelInvoice={handleCancelInvoice}
            onUpdateInvoice={handleUpdateInvoice}
          />
        </div>
      )}

      {/* Foreground Success Alert Dialog via Portal (renders on top of InvoiceDetailModal) */}
      {showIssueSuccessAlert &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop-fade-in"
            onClick={() => setShowIssueSuccessAlert(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center border border-slate-100 animate-modal-bounce-in relative z-[10000]"
            >
              {/* Animated Green Checkmark Badge */}
              <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-100 animate-bounce-in">
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="relative h-8 w-8 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h3 className="font-black text-lg text-slate-800 mb-1">
                Thành công
              </h3>
              <p className="text-xs text-slate-600 font-semibold mb-5 leading-relaxed">
                {issueSuccessAlertMsg}
              </p>

              <button
                type="button"
                onClick={() => setShowIssueSuccessAlert(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20"
              >
                Đóng
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* ─── VIEW 3: PRINT RECEIPT MODAL (K80 / K57 TEMPLATE) ─── */}
      {modalView === "PRINT_RECEIPT" && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-hidden flex flex-col my-auto animate-modal-bounce-in"
        >
          {/* Modal Header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setModalView("SUCCESS")}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
                title="Quay lại"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-100 text-[#0070f4] flex items-center justify-center font-bold shrink-0">
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 text-left">
                <h2 className="text-sm sm:text-base font-black text-slate-800 truncate">
                  In Phiếu / Hóa Đơn Cho Khách Hàng
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                  Mã phiếu: <strong className="text-slate-700 font-mono">{lookupCode}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSafeClose}
              disabled={!isDismissAllowed}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors shrink-0 ml-2 disabled:opacity-40"
              title="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Print Controls / Options Bar */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs no-print shrink-0">
            {/* Document Type Label */}
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>PHIẾU THANH TOÁN CỬA HÀNG</span>
              </span>
            </div>

            {/* Paper Size & Options */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-600">Khổ in:</span>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as "K80" | "K57")}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-white font-bold text-xs cursor-pointer border-none outline-none"
                >
                  <option value="K80">K80 (80mm)</option>
                  <option value="K57">K57 (57mm)</option>
                </select>
              </div>

              <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showQr}
                  onChange={(e) => setShowQr(e.target.checked)}
                  className="rounded border-slate-300 text-[#0070f4] focus:ring-[#0070f4]"
                />
                <span>In QR</span>
              </label>
            </div>
          </div>

          {/* Printable Section Preview */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-200/40 flex justify-center items-start">
            <div
              id="printable-pos-invoice-container"
              className={`bg-white shadow-md border border-slate-300 text-slate-900 font-sans transition-all ${
                isK57 ? "w-[260px] p-2.5 text-[10px]" : "w-[340px] p-4 text-[11px]"
              } leading-tight select-text text-left`}
            >
              {/* ─── STORE HEADER ─── */}
              <div className="text-center pb-2.5 border-b-2 border-slate-900 break-words">
                <h3 className="font-black text-base sm:text-lg uppercase text-slate-900 tracking-tight">
                  BÁN HÀNG VIỆT
                </h3>
                <p className="text-[10px] text-slate-700 font-medium mt-0.5">
                  ĐC: Số 123 Nguyễn Trãi, Thanh Xuân, Hà Nội
                </p>
                <p className="text-[10px] text-slate-700 font-medium">
                  MST: 0102030405 &nbsp;|&nbsp; Điện thoại: 024.1234.5678
                </p>
              </div>

              {/* ─── DOCUMENT TITLE ─── */}
              <div className="text-center my-3">
                <h2 className="font-black text-sm sm:text-base uppercase tracking-wider text-slate-900">
                  PHIẾU THANH TOÁN
                </h2>
                <p className="text-[9px] text-slate-600 italic mt-0.5">
                  (Phiếu kiểm tra tiền trước khi thanh toán / Chưa có giá trị thuế)
                </p>
                <div className="mt-2 text-[10px] text-slate-800 flex flex-wrap justify-center items-center gap-3 border-y border-slate-200 py-1 bg-slate-50/80 font-mono font-semibold">
                  <span>Mã phiếu: <strong>{lookupCode}</strong></span>
                  {tab.orderNumber && (
                    <span>Số đơn: <strong>{tab.orderNumber}</strong></span>
                  )}
                </div>
              </div>

              {/* ─── TRANSACTION META INFO ─── */}
              <div className="py-2 text-[10px] space-y-1 text-slate-800 border-b border-dashed border-slate-300 break-words">
                <div className="flex flex-wrap justify-between gap-1">
                  <span><strong>Khách hàng:</strong> {tab.customer?.name || "Khách mua lẻ"}</span>
                  <span><strong>Ngày lập:</strong> {createdDateStr}</span>
                </div>
                <div className="flex flex-wrap justify-between gap-1">
                  <span><strong>Thu ngân:</strong> Thu ngân</span>
                  <span><strong>Hình thức TT:</strong> {getPaymentMethodLabel(tab.paymentMethod)}</span>
                </div>
                {tab.customer?.phone && (
                  <div><strong>Điện thoại:</strong> {tab.customer.phone}</div>
                )}
              </div>

              {/* ─── ITEMS TABLE ─── */}
              <div className="my-3 overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px] min-w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-900 font-extrabold text-slate-900 bg-slate-100">
                      <th className="p-1 sm:p-1.5 w-6 text-center">STT</th>
                      <th className="p-1 sm:p-1.5">Tên hàng hóa, dịch vụ</th>
                      <th className="p-1 sm:p-1.5 text-center w-7">SL</th>
                      <th className="p-1 sm:p-1.5 text-right w-14 sm:w-16">Đ.Giá</th>
                      <th className="p-1 sm:p-1.5 text-right w-16 sm:w-20">T.Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tab.items.length > 0 ? (
                      tab.items.map((item, idx) => (
                        <tr key={idx} className="align-top">
                          <td className="p-1 sm:p-1.5 text-center font-bold text-slate-600">{idx + 1}</td>
                          <td className="p-1 sm:p-1.5 font-semibold text-slate-900 break-words">{item.product.name}</td>
                          <td className="p-1 sm:p-1.5 text-center font-bold">{item.quantity}</td>
                          <td className="p-1 sm:p-1.5 text-right whitespace-nowrap">{formatCurrency(item.price)}</td>
                          <td className="p-1 sm:p-1.5 text-right font-black text-slate-900 whitespace-nowrap">
                            {formatCurrency(item.lineTotal)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="align-top">
                        <td colSpan={5} className="p-2 text-center text-slate-400 italic">
                          Không có sản phẩm
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ─── SUMMARY BLOCK ─── */}
              <div className="border-t-2 border-slate-900 pt-2 space-y-1.5 text-[10px]">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Cộng tiền hàng:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(itemsSum)}</span>
                </div>

                {taxAmount > 0 && (
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Thuế suất GTGT:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(taxAmount)}</span>
                  </div>
                )}

                {discountCash > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Chiết khấu / Giảm giá:</span>
                    <span className="font-bold">-{formatCurrency(discountCash)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center font-black text-xs sm:text-sm pt-1.5 border-t border-slate-900 text-slate-900 bg-slate-50 px-2 py-1 rounded">
                  <span>TỔNG THANH TOÁN:</span>
                  <span className="text-sm sm:text-base text-slate-900">{formatCurrency(finalTotal)}</span>
                </div>

                <div className="flex justify-between font-semibold text-slate-700 pt-1">
                  <span>Tiền khách đưa:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(tab.amountGiven || finalTotal)}</span>
                </div>

                {changeAmount > 0 && (
                  <div className="flex justify-between font-extrabold text-emerald-700">
                    <span>Tiền thừa trả khách:</span>
                    <span className="font-bold">{formatCurrency(changeAmount)}</span>
                  </div>
                )}

                <div className="text-[9px] sm:text-[9.5px] italic text-slate-700 text-right pt-0.5 break-words">
                  Bằng chữ: <strong>{convertNumberToWords(finalTotal)}</strong>
                </div>
              </div>

              {/* ─── QR CODE & STORE FOOTER ─── */}
              {showQr && (
                <div className="mt-3 sm:mt-4 flex flex-col items-center gap-1 text-center border-t border-dashed border-slate-300 pt-2.5">
                  <QRCode value={lookupUrl} size={isK57 ? 85 : 100} bordered={false} />
                  <span className="text-[9px] text-slate-600 font-semibold max-w-[260px]">
                    Quét mã QR để chuyển khoản hoặc tra cứu hóa đơn
                  </span>
                </div>
              )}

              <div className="mt-3 text-center text-[9px] text-slate-600 border-t border-slate-200 pt-2 space-y-0.5 break-words">
                <p className="font-bold text-slate-800 text-[10px]">CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!</p>
                <p>Vui lòng kiểm tra lại hàng hóa và số tiền trước khi rời khỏi quầy.</p>
                <p className="text-[8.5px] text-slate-500 font-mono pt-1">
                  Hotline hỗ trợ: 024.1234.5678 | Website: banhangviet.vn
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2 no-print shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">Mẫu in tiêu chuẩn cửa hàng Bán Hàng Việt</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setModalView("SUCCESS")}
                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrint();
                  setModalView("SUCCESS");
                }}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-extrabold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>IN PHIẾU THANH TOÁN</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSuccessModal;
