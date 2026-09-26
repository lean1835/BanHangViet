import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { Printer, X, FileText } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateOnly } from "@/utils/dateFormatter";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useGetDebtStatementPrintQuery } from "../services/customerApi";
import type { IDebtStatementPrintResponse } from "../types/ICustomerDebtReconciliation";

interface DebtStatementPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  reconciliationId?: string | null;
  initialData?: IDebtStatementPrintResponse | null;
}

export const DebtStatementPrintModal: React.FC<DebtStatementPrintModalProps> = ({
  isOpen,
  onClose,
  reconciliationId,
  initialData,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const dialogRef = useAccessibleDialog({
    isOpen: isOpen && Boolean(reconciliationId || initialData),
    onClose,
    canClose: true,
  });

  const { data: fetchedData, isLoading } = useGetDebtStatementPrintQuery(
    reconciliationId || "",
    {
      skip: !isOpen || Boolean(initialData) || !reconciliationId,
    },
  );

  const statement = initialData || fetchedData;

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatVietnameseDateText = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `Ngày ${day} tháng ${month} năm ${year}`;
  };

  return createPortal(
    <div
      id="debt-statement-modal-portal"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-backdrop-fade-in"
    >
      <div
        id="debt-statement-modal-panel"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-debt-statement-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-modal-smooth-in"
      >
        {/* Top bar (Ẩn hoàn toàn khi in) */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50 shrink-0 no-print print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kv-blue-primary/10 text-kv-blue-primary">
              <FileText size={18} />
            </div>
            <div>
              <h2
                id="print-debt-statement-title"
                className="text-sm font-extrabold text-slate-800 uppercase tracking-tight"
              >
                Giấy Đối Chiếu và Xác Nhận Công Nợ
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Mã: {statement?.reconciliationCode || reconciliationId || "---"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !statement}
              className="flex items-center gap-1.5 rounded-lg bg-kv-blue-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-kv-blue-dark active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Printer size={15} />
              In biên bản (Print)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Paper Canvas */}
        <div
          id="debt-statement-scroll-container"
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70"
        >
          {isLoading && !statement ? (
            <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center gap-2 no-print">
              <div className="w-8 h-8 border-3 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
              <span>Đang tải thông tin biên bản in...</span>
            </div>
          ) : !statement ? (
            <div className="py-12 text-center text-xs text-rose-500 no-print">
              Không tìm thấy thông tin biên bản đối chiếu để in.
            </div>
          ) : (
            <div
              id="printable-debt-statement"
              ref={printRef}
              className="mx-auto max-w-[800px] bg-white p-8 sm:p-12 shadow-md border border-slate-300 rounded-sm font-['Times_New_Roman',_Times,_serif] text-slate-900 text-[13px] leading-relaxed"
            >
              {/* Quốc hiệu tiêu ngữ chuẩn Việt Nam */}
              <div className="text-center pb-2">
                <p className="font-bold text-sm uppercase tracking-wider text-black">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="text-sm font-bold text-black mt-0.5">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <div className="flex justify-center items-center my-1.5">
                  <span className="w-36 border-b border-black"></span>
                </div>
              </div>

              {/* Tiêu đề Biên bản & Số chứng từ */}
              <div className="text-center my-4">
                <h1 className="text-lg sm:text-xl font-bold text-black uppercase tracking-wide">
                  {statement.documentTitle || "GIẤY ĐỐI CHIẾU VÀ XÁC NHẬN CÔNG NỢ"}
                </h1>
                <p className="text-xs font-mono text-slate-800 mt-1">
                  Mã số: <strong>{statement.reconciliationCode}</strong>
                </p>
              </div>

              {/* Căn cứ pháp lý theo chuẩn biểu mẫu kế toán */}
              <div className="text-xs italic text-slate-700 space-y-1 mb-4">
                <p>- Căn cứ vào thỏa thuận giao dịch mua bán hàng hóa giữa hai bên;</p>
                <p>- Căn cứ vào tình hình giao nhận hàng hóa và chứng từ thanh toán thực tế giữa hai bên.</p>
              </div>

              {/* Mở đầu & Thông tin đại diện hai bên */}
              <p className="text-xs mb-3 text-slate-900">
                Hôm nay, {formatVietnameseDateText(statement.printedDate ? String(statement.printedDate) : new Date().toISOString())}, tại văn phòng hai bên tiến hành lập biên bản đối chiếu công nợ gồm có:
              </p>

              {/* Thông tin đại diện hai bên: luôn cùng hàng 2 cột song song */}
              <div
                id="debt-statement-parties-grid"
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
                className="grid grid-cols-2 gap-6 mb-4 text-xs bg-slate-50/70 p-4 rounded border border-slate-200 print:bg-transparent print:p-0 print:border-none print:mb-4"
              >
                {/* Bên Bán (Hộ kinh doanh / Đại diện) */}
                <div className="flex flex-col gap-1 pr-2">
                  <h3 className="font-bold text-slate-900 uppercase text-xs border-b border-slate-300 pb-1 mb-1">
                    BÊN BÁN (BÊN GIAO HÀNG / CHỦ HỘ)
                  </h3>
                  <p>
                    <strong>Tên đơn vị:</strong> {statement.householdName || "Hộ kinh doanh Bán Hàng Việt"}
                  </p>
                  {statement.householdRepresentative && (
                    <p>
                      <strong>Đại diện:</strong> {statement.householdRepresentative}
                    </p>
                  )}
                  {statement.householdTaxCode && (
                    <p>
                      <strong>Mã số thuế:</strong> {statement.householdTaxCode}
                    </p>
                  )}
                  {statement.householdAddress && (
                    <p>
                      <strong>Địa chỉ:</strong> {statement.householdAddress}
                    </p>
                  )}
                  {statement.householdPhone && (
                    <p>
                      <strong>Điện thoại:</strong> {statement.householdPhone}
                    </p>
                  )}
                </div>

                {/* Bên Mua (Khách hàng) */}
                <div className="flex flex-col gap-1 pl-2">
                  <h3 className="font-bold text-slate-900 uppercase text-xs border-b border-slate-300 pb-1 mb-1">
                    BÊN MUA (KHÁCH HÀNG / BÊN NỢ)
                  </h3>
                  <p>
                    <strong>Tên khách hàng:</strong> {statement.customerName}
                  </p>
                  {statement.customerTaxCode && (
                    <p>
                      <strong>Mã số thuế:</strong> {statement.customerTaxCode}
                    </p>
                  )}
                  <p>
                    <strong>Điện thoại:</strong> {statement.customerPhone || "—"}
                  </p>
                  <p>
                    <strong>Địa chỉ:</strong> {statement.customerAddress || "—"}
                  </p>
                </div>
              </div>

              {/* Lời dẫn kỳ đối chiếu */}
              <p className="text-xs mb-3 text-slate-900">
                Hai bên cùng thống nhất tiến hành đối chiếu tình hình công nợ phát sinh trong kỳ từ ngày{" "}
                <strong>{formatDateOnly(statement.startDate)}</strong> đến hết ngày{" "}
                <strong>{formatDateOnly(statement.endDate)}</strong> với các nội dung chi tiết như sau:
              </p>

              {/* 1. Bảng số liệu chi tiết */}
              <div className="mb-4">
                <p className="font-bold uppercase text-black text-xs mb-1.5 section-title">
                  1. CHI TIẾT CÔNG NỢ PHÁT SINH TRONG KỲ:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-xs text-black">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-black p-2 text-center w-10">STT</th>
                        <th className="border border-black p-2 text-center w-24">Ngày phát sinh</th>
                        <th className="border border-black p-2 text-left">Nội dung / Diễn giải</th>
                        <th className="border border-black p-2 text-center w-28">Mã chứng từ</th>
                        <th className="border border-black p-2 text-right w-28">Phát sinh Tăng (Nợ)</th>
                        <th className="border border-black p-2 text-right w-28">Phát sinh Giảm (Trả)</th>
                        <th className="border border-black p-2 text-right w-28">Dư nợ lũy kế</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Dòng Số dư nợ đầu kỳ */}
                      <tr className="font-bold bg-slate-50/60">
                        <td className="border border-black p-2 text-center">-</td>
                        <td className="border border-black p-2 text-center font-mono">
                          {formatDateOnly(statement.startDate)}
                        </td>
                        <td colSpan={2} className="border border-black p-2 uppercase font-bold">
                          SỐ DƯ NỢ ĐẦU KỲ
                        </td>
                        <td className="border border-black p-2 text-right font-mono">-</td>
                        <td className="border border-black p-2 text-right font-mono">-</td>
                        <td className="border border-black p-2 text-right font-mono font-bold">
                          {formatCurrency(statement.openingDebtBalance)}
                        </td>
                      </tr>

                      {/* Các giao dịch trong kỳ */}
                      {statement.transactions && statement.transactions.length > 0 ? (
                        statement.transactions.map((item, index) => {
                          const isIncrease = item.type === "DEBT_CREATED";
                          return (
                            <tr key={item.id || index}>
                              <td className="border border-black p-2 text-center">{index + 1}</td>
                              <td className="border border-black p-2 text-center font-mono">
                                {formatDateOnly(item.transactionDate)}
                              </td>
                              <td className="border border-black p-2">
                                {item.typeDescription || (isIncrease ? "Mua hàng ghi nợ" : "Thanh toán nợ")}
                                {item.notes ? ` (${item.notes})` : ""}
                              </td>
                              <td className="border border-black p-2 text-center font-mono font-semibold">
                                {item.referenceCode || "—"}
                              </td>
                              <td className="border border-black p-2 text-right font-mono">
                                {isIncrease ? formatCurrency(item.amount) : "-"}
                              </td>
                              <td className="border border-black p-2 text-right font-mono">
                                {!isIncrease ? formatCurrency(item.amount) : "-"}
                              </td>
                              <td className="border border-black p-2 text-right font-mono font-bold">
                                {formatCurrency(item.runningBalance)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="border border-black p-3 text-center text-slate-600 italic"
                          >
                            Trong kỳ đối chiếu không phát sinh giao dịch mua hàng nợ hoặc trả nợ nào.
                          </td>
                        </tr>
                      )}

                      {/* Dòng Tổng phát sinh trong kỳ */}
                      <tr className="font-bold bg-slate-50/80">
                        <td colSpan={4} className="border border-black p-2 text-right uppercase">
                          TỔNG PHÁT SINH TRONG KỲ:
                        </td>
                        <td className="border border-black p-2 text-right font-mono font-bold">
                          {formatCurrency(statement.totalDebtIncurred || 0)}
                        </td>
                        <td className="border border-black p-2 text-right font-mono font-bold">
                          {formatCurrency(statement.totalDebtPaid || 0)}
                        </td>
                        <td className="border border-black p-2 text-right font-mono">-</td>
                      </tr>

                      {/* Dòng Số dư nợ cuối kỳ */}
                      <tr className="font-black bg-slate-100 text-sm">
                        <td colSpan={4} className="border border-black p-2.5 text-right uppercase">
                          SỐ DƯ NỢ CUỐI KỲ (ĐẾN NGÀY {formatDateOnly(statement.endDate)}):
                        </td>
                        <td
                          colSpan={3}
                          className="border border-black p-2.5 text-right font-mono text-base font-black"
                        >
                          {formatCurrency(statement.closingDebtBalance || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Kết luận & Cam kết */}
              <div id="debt-statement-conclusion" className="mb-6 text-xs space-y-1.5">
                <p className="font-bold uppercase text-black">
                  2. KẾT LUẬN VÀ THỎA THUẬN:
                </p>
                <div className="pl-3 space-y-1 text-slate-900">
                  <p>
                    • Tính đến hết ngày <strong>{formatDateOnly(statement.endDate)}</strong>, số dư nợ Bên Mua (Bên B) còn phải thanh toán cho Bên Bán (Bên A) số tiền nợ là:{" "}
                    <strong className="text-sm font-bold font-mono">
                      {formatCurrency(statement.closingDebtBalance || 0)}
                    </strong>
                  </p>
                  <p>
                    • Số dư nợ cuối kỳ bằng chữ: <em className="font-bold underline">{statement.closingDebtInWords || "Không đồng"}</em>.
                  </p>
                  {statement.notes && (
                    <p>
                      • Ghi chú / Thỏa thuận cụ thể: <em>{statement.notes}</em>
                    </p>
                  )}
                  <p>
                    • Hai bên thống nhất toàn bộ số liệu công nợ nêu trên là hoàn toàn chính xác, trung thực.
                  </p>
                  <p>
                    • Biên bản này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản để làm căn cứ thanh toán và theo dõi công nợ.
                  </p>
                </div>
              </div>

              {/* Phần ngày tháng & Khối chữ ký xác nhận của hai bên */}
              <div id="debt-statement-footer" className="mt-6 text-xs">
                <div className="text-right italic mb-2 pr-4 text-slate-800">
                  {statement.printedDate
                    ? formatVietnameseDateText(String(statement.printedDate))
                    : formatVietnameseDateText(new Date().toISOString())}
                </div>

                <div
                  id="debt-statement-signatures"
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}
                  className="grid grid-cols-2 gap-8 text-center pt-2 pb-6"
                >
                  <div>
                    <p className="font-bold uppercase text-black text-xs">
                      {statement.sellerSignTitle || "ĐẠI DIỆN BÊN BÁN"}
                    </p>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                      (Ký, đóng dấu và ghi rõ họ tên)
                    </p>
                    <div className="h-20 sm:h-28 signature-space"></div>
                    <p className="font-bold text-black text-xs">
                      {statement.householdRepresentative || statement.householdName || ""}
                    </p>
                  </div>

                  <div>
                    <p className="font-bold uppercase text-black text-xs">
                      {statement.buyerSignTitle || "ĐẠI DIỆN BÊN MUA"}
                    </p>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                      (Ký, xác nhận nợ và ghi rõ họ tên)
                    </p>
                    <div className="h-20 sm:h-28 signature-space"></div>
                    <p className="font-bold text-black text-xs">
                      {statement.customerName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DebtStatementPrintModal;
