import React, { useState } from "react";
import { X, Printer, Download, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { useNotification } from "@/hooks/useNotification";
import {
  useGetInvoiceRepresentationQuery,
  useGetInvoiceQuery,
  downloadInvoiceRepresentationPdf,
} from "../services/eInvoiceApi";

interface InvoiceRepresentationModalProps {
  invoiceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceRepresentationModal: React.FC<InvoiceRepresentationModalProps> = ({
  invoiceId,
  isOpen,
  onClose,
}) => {
  const { showError, showSuccess } = useNotification();
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    data: repResponse,
    isLoading: isRepLoading,
    isError,
    error,
    refetch,
  } = useGetInvoiceRepresentationQuery(invoiceId, {
    skip: !isOpen || !invoiceId,
  });

  const { data: invoiceResponse, isLoading: isInvoiceLoading } = useGetInvoiceQuery(invoiceId, {
    skip: !isOpen || !invoiceId,
  });

  const rep = repResponse?.result;
  const invoice = invoiceResponse?.result;
  const isLoading = isRepLoading || isInvoiceLoading;

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!rep) return;
    setIsDownloading(true);
    try {
      await downloadInvoiceRepresentationPdf(rep.invoiceId, rep.invoiceNumber || undefined);
      showSuccess("Đã tải bản thể hiện hóa đơn điện tử thành công!");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Không thể tải bản thể hiện hóa đơn.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-kv-blue-primary flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">
                Bản thể hiện hóa đơn điện tử
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {rep?.invoiceNumber
                  ? `Hóa đơn số: ${rep.invoiceNumber} | Ký hiệu: ${rep.invoiceSymbol}`
                  : "Xem trước thể thức pháp lý hóa đơn điện tử"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !rep}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
              title="In bản thể hiện (A4)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>In</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isLoading || !rep || isDownloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-kv-blue-primary hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
              title="Tải bản thể hiện (.html)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? "Đang tải..." : "Tải về"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors ml-2"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Paper Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500">
              <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold">Đang kết xuất bản thể hiện từ máy chủ...</p>
            </div>
          )}

          {isError && (
            <div className="bg-white p-8 rounded-xl border border-red-200 text-center max-w-md my-auto shadow-sm">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-slate-800 mb-1">
                Không thể tải bản thể hiện hóa đơn
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                {error && "data" in error
                  ? String((error as { data: { message?: string } }).data?.message)
                  : "Vui lòng kiểm tra lại kết nối hoặc quyền truy cập."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 bg-kv-blue-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Thử lại
              </button>
            </div>
          )}

          {rep && (
            <div className="relative w-full max-w-[800px] bg-white border border-slate-300 rounded-xl p-8 sm:p-10 shadow-lg text-slate-800 text-[11px] font-normal leading-relaxed print:border-none print:shadow-none print:p-0">
              {/* Dynamic Watermark Overlay */}
              {rep.watermarkText && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
                  <div className="transform -rotate-[30deg] border-4 border-dashed border-red-500/35 text-red-600/30 font-black text-4xl sm:text-5xl uppercase tracking-widest px-8 py-4 rounded-2xl text-center">
                    {rep.watermarkText}
                  </div>
                </div>
              )}

              {/* Title Header */}
              <div className="text-center border-b border-slate-200 pb-5 mb-5">
                <h2 className="text-base sm:text-lg font-black text-kv-blue-primary uppercase tracking-wider">
                  {rep.title || "HÓA ĐƠN GIÁ TRỊ GIA TĂNG"}
                </h2>
                {rep.isDraft && (
                  <p className="text-red-600 font-extrabold text-xs mt-1">
                    (BẢN NHÁP - CHƯA CÓ GIÁ TRỊ PHÁP LÝ)
                  </p>
                )}
                {rep.isCanceled && (
                  <p className="text-red-600 font-extrabold text-xs mt-1">
                    (HÓA ĐƠN ĐÃ BỊ HỦY BỎ)
                  </p>
                )}
                <div className="mt-3 flex items-center justify-center flex-wrap gap-4 text-xs font-semibold text-slate-600">
                  <span>
                    Ký hiệu: <strong className="text-slate-900">{rep.invoiceSymbol}</strong>
                  </span>
                  <span>|</span>
                  <span>
                    Mẫu số: <strong className="text-slate-900">{rep.invoicePattern}</strong>
                  </span>
                  <span>|</span>
                  <span>
                    Số:{" "}
                    <strong className="text-kv-blue-primary font-mono text-sm">
                      {rep.invoiceNumber || "--------"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Seller / Household Info */}
              <div className="border-b border-slate-200 pb-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <p className="sm:col-span-2">
                    <span className="font-bold text-slate-700">Đơn vị bán hàng:</span>{" "}
                    <span className="font-extrabold text-slate-900 uppercase">
                      {rep.householdName}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Mã số thuế:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">
                      {rep.householdTaxCode}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Điện thoại:</span>{" "}
                    <span className="font-medium text-slate-800">{rep.householdPhone || "-"}</span>
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-bold text-slate-700">Địa chỉ:</span>{" "}
                    <span className="text-slate-800">{rep.householdAddress}</span>
                  </p>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="border-b border-slate-200 pb-4 mb-4 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <p className="sm:col-span-2">
                    <span className="font-bold text-slate-700">Họ tên người mua hàng:</span>{" "}
                    <span className="font-bold text-slate-900">
                      {rep.buyerName || "Khách hàng cá nhân không lấy hóa đơn"}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Mã số thuế:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">
                      {rep.buyerTaxCode || "-"}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Điện thoại:</span>{" "}
                    <span className="text-slate-800">{rep.buyerPhone || "-"}</span>
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-bold text-slate-700">Địa chỉ:</span>{" "}
                    <span className="text-slate-800">{rep.buyerAddress || "-"}</span>
                  </p>
                  {rep.buyerEmail && (
                    <p className="sm:col-span-2">
                      <span className="font-bold text-slate-700">Email nhận HĐ:</span>{" "}
                      <span className="text-slate-800">{rep.buyerEmail}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Adjustment Reference Note if applicable */}
              {rep.referenceNote && (
                <div className="mb-4 p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs font-semibold text-blue-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{rep.referenceNote}</span>
                </div>
              )}

              {/* Items Table */}
              <div className="overflow-x-auto my-4 border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[9px]">
                      <th className="p-2 border-r border-slate-200 text-center w-8">STT</th>
                      <th className="p-2 border-r border-slate-200">Tên hàng hóa, dịch vụ</th>
                      <th className="p-2 border-r border-slate-200 text-center w-12">ĐVT</th>
                      <th className="p-2 border-r border-slate-200 text-center w-12">Số lượng</th>
                      <th className="p-2 border-r border-slate-200 text-right w-24">Đơn giá</th>
                      <th className="p-2 border-r border-slate-200 text-right w-20">Chiết khấu</th>
                      <th className="p-2 border-r border-slate-200 text-center w-14">Thuế (%)</th>
                      <th className="p-2 text-right w-24">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {invoice?.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">
                            {idx + 1}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-semibold text-slate-800">
                            {item.productName}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center text-slate-600">
                            {item.unit || "Cái"}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">
                            {item.quantity}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right text-emerald-700">
                            {item.discountAmount && item.discountAmount > 0
                              ? `-${formatCurrency(item.discountAmount)}`
                              : "-"}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center">
                            {item.taxRatePercentage || 0}%
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400">
                          Chi tiết hàng hóa thể hiện theo chứng từ gốc đính kèm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="border-t border-slate-200 pt-4 mt-4 flex flex-col gap-1 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Cộng tiền hàng (chưa có thuế GTGT):</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(rep.totalAmountBeforeTax)}
                  </span>
                </div>
                {rep.discountAmount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                    <span>Tổng tiền chiết khấu thương mại:</span>
                    <span className="font-bold">-{formatCurrency(rep.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Tổng tiền thuế GTGT:</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(rep.taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b-2 border-slate-300 text-sm font-extrabold text-kv-blue-primary">
                  <span>Tổng cộng tiền thanh toán:</span>
                  <span>{formatCurrency(rep.finalAmount)}</span>
                </div>
                <div className="py-2 italic text-slate-700">
                  <strong>Số tiền viết bằng chữ:</strong> {rep.amountInWords}
                </div>
              </div>

              {/* Tax Verification & Lookup Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] text-slate-500 bg-slate-50/80 p-4 rounded-xl">
                <div>
                  <p className="font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Cơ quan thuế cấp mã:
                  </p>
                  <p className="font-mono text-xs font-bold text-emerald-700">
                    {rep.taxAuthorityCode || "(Chưa cấp mã)"}
                  </p>
                  <p className="mt-1">
                    Ngày lập: {rep.issuedAt ? formatDate(rep.issuedAt) : "-"}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Mã tra cứu hóa đơn:
                  </p>
                  <p className="font-mono text-xs font-bold text-kv-blue-primary">
                    {rep.lookupCode}
                  </p>
                  <p className="mt-1 text-slate-400">
                    Tra cứu tại: banhangviet.vn/lookup-invoice
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
