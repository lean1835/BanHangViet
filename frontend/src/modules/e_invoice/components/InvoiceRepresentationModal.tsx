import React, { useState, useRef, useEffect } from "react";
import { X, Printer, Download, AlertCircle, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { formatCurrency } from "@/utils/formatCurrency";
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

const formatInvoiceFullTime = (isoString?: string | null): string => {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
};

export const InvoiceRepresentationModal: React.FC<InvoiceRepresentationModalProps> = ({
  invoiceId,
  isOpen,
  onClose,
}) => {
  const { showError, showSuccess } = useNotification();
  const [isDownloading, setIsDownloading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const invoicePaperRef = useRef<HTMLDivElement>(null);

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

  const isCanceled = Boolean(
    rep?.isCanceled ||
      rep?.status === "CANCELED" ||
      rep?.status === "CANCELLED" ||
      invoice?.status === "CANCELLED" ||
      invoice?.status === "CANCELED"
  );
  const isAdjusted = Boolean(
    rep?.isAdjusted ||
      rep?.status === "ADJUSTED" ||
      invoice?.status === "ADJUSTED"
  );
  const isDraft = Boolean(
    rep?.isDraft ||
      rep?.status === "DRAFT" ||
      invoice?.status === "DRAFT" ||
      (!rep?.invoiceNumber && !isCanceled)
  );

  // Tự động cuộn lên đầu trang giấy mỗi khi mở modal hoặc khi dữ liệu load xong
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, isLoading, rep]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!rep) return;
    setIsDownloading(true);
    try {
      if (invoicePaperRef.current) {
        const canvas = await html2canvas(invoicePaperRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 5) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const fileName = `Hoa_don_${rep.invoiceNumber || rep.invoiceId}.pdf`;
        pdf.save(fileName);
        showSuccess(`Đã tải bản thể hiện hóa đơn (${fileName}) thành công!`);
      } else {
        await downloadInvoiceRepresentationPdf(rep.invoiceId, rep.invoiceNumber || undefined);
        showSuccess("Đã tải bản thể hiện hóa đơn thành công!");
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Không thể tạo tệp PDF bản thể hiện.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 overflow-hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-kv-blue-primary flex items-center justify-center font-bold shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-800">
                  Bản thể hiện hóa đơn điện tử
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Chuẩn NĐ 123 & TT 78
                </span>
              </div>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
              title="In bản thể hiện ra giấy A4"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>In</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isLoading || !rep || isDownloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-kv-blue-primary hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
              title="Tải bản thể hiện (.pdf)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? "Đang xuất PDF..." : "Tải PDF"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors ml-1"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Container / A4 Paper Workspace */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-200/80 flex justify-center print:p-0 print:bg-white print:overflow-visible"
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[450px] gap-3 text-slate-500">
              <div className="w-9 h-9 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold">Đang kết xuất bản thể hiện từ máy chủ...</p>
            </div>
          )}

          {isError && (
            <div className="bg-white p-8 rounded-xl border border-red-200 text-center max-w-md my-auto shadow-md">
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
            <div
              ref={invoicePaperRef}
              id="invoice-representation-paper"
              className="relative w-full max-w-[850px] bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-10 text-slate-800 text-xs leading-relaxed font-sans print:border-none print:shadow-none print:p-0 print:w-full my-auto overflow-hidden"
            >
              {/* Chữ chìm mờ nền HÓA ĐƠN ĐIỆN TỬ khi hóa đơn bình thường */}
              {!isCanceled && !isAdjusted && !isDraft && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                  <div className="transform -rotate-[25deg] text-slate-200/40 font-black text-5xl sm:text-7xl uppercase tracking-widest text-center whitespace-nowrap">
                    HÓA ĐƠN ĐIỆN TỬ
                  </div>
                </div>
              )}

              {/* Con dấu trạng thái dạng mờ, viền nét đứt bán trong suốt nổi lên trước nội dung (z-20) */}
              {isCanceled && (
                <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-20">
                  <div className="border-[3px] border-dashed border-rose-500/60 rounded-3xl px-8 sm:px-12 py-4 sm:py-6 text-center transform -rotate-[25deg] bg-transparent">
                    <p className="text-3xl sm:text-5xl font-black text-rose-500/40 uppercase tracking-widest whitespace-nowrap">
                      HÓA ĐƠN ĐÃ HỦY
                    </p>
                  </div>
                </div>
              )}

              {isAdjusted && !isCanceled && (
                <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-20">
                  <div className="border-[3px] border-dashed border-amber-500/60 rounded-3xl px-8 sm:px-12 py-4 sm:py-6 text-center transform -rotate-[25deg] bg-transparent">
                    <p className="text-2xl sm:text-4xl font-black text-amber-600/40 uppercase tracking-widest whitespace-nowrap">
                      HÓA ĐƠN ĐIỀU CHỈNH
                    </p>
                  </div>
                </div>
              )}

              {isDraft && !isCanceled && (
                <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-20">
                  <div className="border-[3px] border-dashed border-slate-400/60 rounded-3xl px-8 sm:px-12 py-4 sm:py-6 text-center transform -rotate-[25deg] bg-transparent">
                    <p className="text-2xl sm:text-4xl font-black text-slate-500/40 uppercase tracking-widest whitespace-nowrap">
                      BẢN NHÁP
                    </p>
                  </div>
                </div>
              )}

              <div className="relative z-10 flex flex-col gap-6">
                {/* 1. Header: Bên trái Tiêu đề lớn + Ngày lập, Bên phải Mẫu số, Ký hiệu, Số HĐ */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="space-y-1.5">
                    <h1 className="text-xl sm:text-2xl font-black text-blue-600 uppercase tracking-tight">
                      HÓA ĐƠN KHỞI TẠO TỪ MÁY TÍNH TIỀN
                    </h1>
                    <p className="text-[11px] text-slate-400 font-medium">
                      (Bản mô phỏng hóa đơn điện tử)
                    </p>
                    {isCanceled && (
                      <p className="text-xs text-rose-600 font-bold uppercase tracking-wide">
                        (HÓA ĐƠN ĐÃ BỊ HỦY BỎ)
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-xs font-semibold text-slate-700">
                        Ngày lập: {formatInvoiceFullTime(rep.issuedAt || invoice?.createdAt || invoice?.time)}
                      </span>
                      {isCanceled && (
                        <span className="bg-red-50 text-red-600 border border-red-300 rounded px-2 py-0.5 text-[10px] font-extrabold uppercase">
                          ĐÃ HỦY
                        </span>
                      )}
                      {rep.taxAuthorityCode ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-300 rounded px-2 py-0.5 text-[10px] font-extrabold uppercase">
                          ĐÃ CẤP MÃ THUẾ
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-600 border border-amber-300 rounded px-2 py-0.5 text-[10px] font-extrabold uppercase">
                          CHỜ CẤP MÃ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thông tin Mẫu số, Ký hiệu, Số HĐ, Mã tra cứu bên phải */}
                  <div className="text-right text-xs space-y-1 sm:min-w-[180px]">
                    <p className="text-slate-600">
                      Mẫu số: <strong className="font-mono text-slate-900">{rep.invoicePattern || "1C26TAA"}</strong>
                    </p>
                    <p className="text-slate-600">
                      Ký hiệu: <strong className="font-mono text-slate-900">{rep.invoiceSymbol || "HUHSHOP"}</strong>
                    </p>
                    <p className="text-slate-600">
                      Số HĐ:{" "}
                      <strong className="font-mono text-blue-600 font-black text-sm">
                        {rep.invoiceNumber || "0000001"}
                      </strong>
                    </p>
                    <p className="text-slate-600">
                      Mã tra cứu:{" "}
                      <strong className="font-mono text-slate-900">{rep.lookupCode || "7568491050"}</strong>
                    </p>
                  </div>
                </div>

                {/* 2. Đơn vị bán hàng */}
                <div className="space-y-1 text-xs">
                  <h2 className="font-extrabold text-sm text-slate-900 uppercase">
                    ĐƠN VỊ BÁN HÀNG: {rep.householdName || "HỘ KINH DOANH TẠP HÓA VIỆT"}
                  </h2>
                  <p className="text-slate-600">
                    Mã số thuế: <strong className="font-mono text-slate-900">{rep.householdTaxCode || "0123456789"}</strong>
                  </p>
                  <p className="text-slate-600">
                    Địa chỉ: <span>{rep.householdAddress || "123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh"}</span>
                  </p>
                  <p className="text-slate-600">
                    Điện thoại: <span>{rep.householdPhone || "0901234567"}</span>
                  </p>
                </div>

                {/* 3. Thông tin người mua hàng */}
                <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                    THÔNG TIN NGƯỜI MUA HÀNG
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-slate-600">
                    <p>
                      Họ tên người mua:{" "}
                      <strong className="text-slate-900 font-bold">{rep.buyerName || "Khách mua lẻ"}</strong>
                    </p>
                    <p>
                      Mã số thuế: <strong className="font-mono text-slate-900">{rep.buyerTaxCode || "-"}</strong>
                    </p>
                    <p>
                      Địa chỉ: <span>{rep.buyerAddress || "-"}</span>
                    </p>
                    <p></p>
                    <p>
                      Điện thoại: <span>{rep.buyerPhone || "-"}</span>
                    </p>
                    <p>
                      Email: <span>{rep.buyerEmail || "-"}</span>
                    </p>
                  </div>
                </div>

                {/* 4. Bảng chi tiết mặt hàng */}
                <div className="border border-slate-200 rounded-lg overflow-hidden mt-1">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                        <th className="p-2.5 text-center w-10 border-r border-slate-200">STT</th>
                        <th className="p-2.5 border-r border-slate-200">TÊN HÀNG HÓA, DỊCH VỤ</th>
                        <th className="p-2.5 text-center w-14 border-r border-slate-200">ĐVT</th>
                        <th className="p-2.5 text-center w-12 border-r border-slate-200">SL</th>
                        <th className="p-2.5 text-right w-24 border-r border-slate-200">ĐƠN GIÁ</th>
                        <th className="p-2.5 text-right w-24 border-r border-slate-200">CHIẾT KHẤU</th>
                        <th className="p-2.5 text-center w-16 border-r border-slate-200">THUẾ (%)</th>
                        <th className="p-2.5 text-right w-28">THÀNH TIỀN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {invoice?.items && invoice.items.length > 0 ? (
                        invoice.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-center text-slate-500 border-r border-slate-200">
                              {idx + 1}
                            </td>
                            <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">
                              {item.productName}
                            </td>
                            <td className="p-2.5 text-center text-slate-600 border-r border-slate-200">
                              {item.unit || "Gói"}
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-900 border-r border-slate-200">
                              {item.quantity}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-700 border-r border-slate-200">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-600 border-r border-slate-200">
                              {item.discountAmount && item.discountAmount > 0
                                ? formatCurrency(item.discountAmount)
                                : "0 đ"}
                            </td>
                            <td className="p-2.5 text-center text-slate-600 border-r border-slate-200">
                              {item.taxRatePercentage || 0}%
                            </td>
                            <td className="p-2.5 text-right font-bold font-mono text-slate-900">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                            Không có dữ liệu mặt hàng
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 5. Khối tổng kết tiền bo góc tách biệt */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Cộng tiền hàng (Chưa thuế):</span>
                    <span className="font-bold font-mono text-slate-800">
                      {formatCurrency(rep.totalAmountBeforeTax)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Tổng tiền thuế GTGT:</span>
                    <span className="font-bold font-mono text-slate-800">
                      {formatCurrency(rep.taxAmount)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-extrabold text-sm text-slate-900">Tổng tiền thanh toán:</span>
                    <span className="font-black font-mono text-blue-600 text-base sm:text-lg">
                      {formatCurrency(rep.finalAmount)}
                    </span>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-600 italic">
                    <span>Số tiền viết bằng chữ: </span>
                    <strong className="text-slate-800 not-italic font-semibold">{rep.amountInWords}</strong>
                  </div>

                  <div className="pt-2 border-t border-dashed border-slate-200 text-center text-[10.5px] text-slate-500 italic">
                    {rep.footerNote || `Cảm ơn quý khách đã mua hàng tại ${rep.householdName || "Hộ kinh doanh Tạp Hóa Việt"}!`}
                  </div>
                </div>

                {/* 6. Phần Chữ ký người mua & Người bán */}
                <div className="grid grid-cols-2 gap-6 pt-4 text-center">
                  <div>
                    <h4 className="font-extrabold text-xs uppercase text-slate-900">NGƯỜI MUA HÀNG</h4>
                    <p className="text-[10px] text-slate-400 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
                    <div className="h-16 flex items-center justify-center">
                      <span className="text-[10px] text-slate-300 italic">(Ký số điện tử)</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-xs uppercase text-slate-900">NGƯỜI BÁN HÀNG</h4>
                    <p className="text-[10px] text-slate-400 italic mt-0.5">(Ký, đóng dấu điện tử)</p>
                    <div className="mt-2 flex justify-center">
                      {/* Con dấu đỏ điện tử xoay nhẹ */}
                      <div className="border border-rose-400 bg-rose-50/40 rounded-lg p-2.5 text-center transform -rotate-1 max-w-[220px] shadow-xs">
                        <p className="font-black text-rose-600 text-[11px] uppercase tracking-wide">
                          ĐÃ KÝ SỐ ĐIỆN TỬ
                        </p>
                        <p className="font-extrabold text-rose-600 text-[9.5px] uppercase mt-0.5 line-clamp-1">
                          {rep.householdName || "HỘ KINH DOANH TẠP HÓA VIỆT"}
                        </p>
                        <p className="text-rose-600 text-[9px] font-mono mt-0.5">
                          MST: {rep.householdTaxCode || "0123456789"}
                        </p>
                        <p className="text-rose-600 text-[8.5px] mt-0.5">
                          Ngày ký: {formatInvoiceFullTime(rep.issuedAt || invoice?.createdAt || invoice?.time)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. Hộp Mã Cơ Quan Thuế Cấp ở giữa dưới cùng */}
                <div className="flex justify-center pt-2">
                  <div className="border-2 border-emerald-500 bg-white rounded-lg px-4 py-2 text-center shadow-xs">
                    <p className="font-extrabold text-emerald-800 text-[10px] uppercase tracking-wide">
                      MÃ CƠ QUAN THUẾ CẤP
                    </p>
                    <p className="font-mono font-black text-emerald-700 text-xs mt-0.5">
                      {rep.taxAuthorityCode || "CQT-20260715-171300"}
                    </p>
                    <p className="text-[9.5px] text-emerald-600 mt-0.5">
                      Ngày cấp: {formatInvoiceFullTime(invoice?.taxResponseAt || rep.issuedAt || invoice?.createdAt || invoice?.time)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
