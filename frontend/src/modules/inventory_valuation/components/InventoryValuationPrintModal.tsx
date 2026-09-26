import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X, FileText } from "lucide-react";
import { useGetMyHouseholdQuery } from "@/modules/settings/services/settingsApi";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/dateFormatter";
import { convertNumberToWords } from "@/modules/e_invoice/utils/eInvoiceHelpers";
import type {
  IInventoryValuationReport,
  IInventoryValuationSummary,
  IProductGroupValuation,
  IInventoryValuationItem,
  IMissingCostProduct,
} from "../types/IInventoryValuation";

const EMPTY_GROUPS: IProductGroupValuation[] = [];
const EMPTY_ITEMS: IInventoryValuationItem[] = [];
const EMPTY_MISSING_ITEMS: IMissingCostProduct[] = [];

interface InventoryValuationPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: IInventoryValuationReport;
  summary?: IInventoryValuationSummary;
}

type PrintScope = "all" | "groups" | "items";

export const InventoryValuationPrintModal: React.FC<InventoryValuationPrintModalProps> = ({
  isOpen,
  onClose,
  report,
  summary: propSummary,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [printScope, setPrintScope] = useState<PrintScope>("all");

  const { data: householdResponse } = useGetMyHouseholdQuery(undefined, {
    skip: !isOpen,
  });
  const household = householdResponse?.result;

  const summary = propSummary || report?.summary;
  const groups = report?.groupValuations ?? EMPTY_GROUPS;
  const items = report?.items ?? EMPTY_ITEMS;
  const missingCostItems = report?.missingCostItems ?? EMPTY_MISSING_ITEMS;

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Current print date
  const printDateStr = useMemo(() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    const h = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    return {
      full: `Ngày ${d} tháng ${m} năm ${y}`,
      withTime: `${h}:${mi} - ${d}/${m}/${y}`,
      day: d,
      month: m,
      year: y,
    };
  }, []);

  // Total sums calculated cleanly
  const totalValuation = summary?.totalInventoryValue || 0;
  const totalRetail = summary?.totalRetailValue || 0;
  const potentialProfit = summary?.potentialGrossProfit || Math.max(0, totalRetail - totalValuation);
  const profitMargin = summary?.potentialProfitMargin || (totalRetail > 0 ? ((potentialProfit / totalRetail) * 100).toFixed(2) : "0");

  const totalGroupQty = useMemo(() => {
    return groups.reduce((sum, g) => sum + (g.totalStockQuantity || 0), 0);
  }, [groups]);

  const totalItemQty = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.stockQuantity || 0), 0);
  }, [items]);

  if (!isOpen) return null;

  return createPortal(
    <div
      id="inventory-valuation-print-modal-portal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventory-valuation-print-modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-backdrop-fade-in"
    >

      <div
        id="inventory-valuation-print-panel"
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-auto flex flex-col h-[92vh] max-h-[92vh] animate-modal-bounce-in focus:outline-none"
      >
        {/* Top Header Action Bar (Hidden when printing) */}
        <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between shadow-sm shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-white/10 text-white">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2
                id="inventory-valuation-print-modal-title"
                className="text-xs font-bold uppercase tracking-wider text-white"
              >
                Mẫu Báo Cáo Định Giá Tồn Kho Chứng Từ
              </h2>
              <p className="text-[11px] text-slate-300 font-normal">
                Quy tắc QTN-23 • Phương pháp bình quân gia quyền di động
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Print Scope Selector */}
            <div className="hidden sm:flex items-center bg-slate-700/80 rounded-lg p-0.5 text-xs text-slate-300">
              <button
                type="button"
                onClick={() => setPrintScope("all")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  printScope === "all" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-white"
                }`}
              >
                Toàn bộ ({groups.length} nhóm, {items.length} mặt hàng)
              </button>
              <button
                type="button"
                onClick={() => setPrintScope("groups")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  printScope === "groups" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-white"
                }`}
              >
                Nhóm hàng ({groups.length})
              </button>
              <button
                type="button"
                onClick={() => setPrintScope("items")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  printScope === "items" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-white"
                }`}
              >
                Từng mặt hàng ({items.length})
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-4 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In báo cáo</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div
          id="inventory-valuation-print-scroll-container"
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center items-start"
        >
          {/* Printable Accounting Document Sheet */}
          <div
            id="printable-inventory-valuation"
            className="w-full max-w-[210mm] bg-white border border-slate-300 shadow-md p-6 sm:p-8 text-black text-xs font-sans"
          >
            {/* 1. Header: Enterprise Information & National Motto */}
            <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
              <div className="w-[58%]">
                <div className="font-extrabold uppercase text-xs sm:text-sm tracking-wide text-slate-900">
                  {household?.name || "HỘ KINH DOANH BÁN HÀNG VIỆT"}
                </div>
                <div className="text-[11px] text-slate-700 mt-0.5">
                  Địa chỉ: {household?.address || "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM"}
                </div>
                <div className="text-[11px] text-slate-700 mt-0.5">
                  Điện thoại: {household?.phoneNumber || "0901234567"} • MST: {household?.taxCode || "0123456789"}
                </div>
              </div>

              <div className="text-center w-[40%]">
                <div className="font-bold uppercase text-[11px] tracking-wider">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[10px] font-semibold italic mt-0.5">
                  Độc lập - Tự do - Hạnh phúc
                </div>
                <div className="w-24 h-0.5 bg-black mx-auto mt-1.5" />
                <div className="text-[9px] text-slate-500 italic mt-1 font-mono">
                  Mẫu số: 01-BC-TK (QTN-23)
                </div>
              </div>
            </div>

            {/* 2. Document Title */}
            <div className="text-center my-4">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
                BÁO CÁO GIÁ TRỊ TỒN KHO THEO GIÁ VỐN
              </h1>
              <p className="text-[11px] italic text-slate-600 mt-0.5">
                (Ban hành theo quy tắc kế toán kho & phương pháp Bình quân gia quyền di động - MAC)
              </p>
              <div className="text-[10px] text-slate-600 mt-1 flex items-center justify-center gap-3">
                {summary?.asOfDate && (
                  <span>
                    Thời điểm chốt số liệu: <strong>{formatDateShort(summary.asOfDate)}</strong>
                  </span>
                )}
                <span>•</span>
                <span>Thời điểm in: <strong>{printDateStr.withTime}</strong></span>
              </div>
            </div>

            {/* 3. Section I: Financial KPIs Summary */}
            <div className="mb-5">
              <div className="font-extrabold text-xs uppercase mb-1.5 flex items-center gap-1.5 border-b border-black pb-0.5">
                <span>I. TỔNG HỢP GIÁ TRỊ VỐN ĐỌNG & KỲ VỌNG TÀI CHÍNH</span>
              </div>

              <table className="w-full text-[11px] border border-black mb-2">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold w-[35%] bg-slate-50 border-r border-slate-300">
                      1. Tổng giá trị vốn đọng trong kho:
                    </td>
                    <td className="p-2 font-extrabold text-rose-700 text-sm">
                      {formatCurrency(totalValuation)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">
                      2. Số tiền viết bằng chữ:
                    </td>
                    <td className="p-2 italic font-semibold text-slate-800">
                      {convertNumberToWords(totalValuation)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">
                      3. Tổng giá trị theo giá bán lẻ:
                    </td>
                    <td className="p-2 font-bold text-slate-800">
                      {formatCurrency(totalRetail)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">
                      4. Lãi gộp tiềm năng (nếu bán hết):
                    </td>
                    <td className="p-2 font-bold text-emerald-700">
                      {formatCurrency(potentialProfit)} (Tỷ suất lợi nhuận kỳ vọng: {profitMargin}%)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">
                      5. Quy mô danh mục hàng hóa:
                    </td>
                    <td className="p-2 text-slate-800">
                      Tổng số: <strong>{summary?.totalProducts || items.length + missingCostItems.length}</strong> mặt hàng
                      {" "}(Có giá vốn: <strong>{items.length}</strong>, Chưa có giá vốn: <strong>{missingCostItems.length}</strong>)
                      {" "}• Thời gian lưu kho trung bình: <strong>{summary?.averageDaysInStock || 0} ngày</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Section II: Breakdown by Product Groups */}
            {(printScope === "all" || printScope === "groups") && groups.length > 0 && (
              <div className="mb-5">
                <div className="font-extrabold text-xs uppercase mb-1.5 flex items-center justify-between border-b border-black pb-0.5">
                  <span>II. CƠ CẤU GIÁ TRỊ VỐN TỒN THEO NHÓM HÀNG</span>
                  <span className="text-[10px] font-normal normal-case italic text-slate-600">
                    ({groups.length} nhóm ngành hàng)
                  </span>
                </div>

                <table className="w-full text-[10.5px] border border-black text-left">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-black">
                      <th className="p-2 w-10 text-center border-r border-black">#</th>
                      <th className="p-2 border-r border-black">Nhóm hàng</th>
                      <th className="p-2 w-20 text-center border-r border-black">Số SP</th>
                      <th className="p-2 w-24 text-right border-r border-black">Tổng SL tồn</th>
                      <th className="p-2 w-32 text-right border-r border-black">Vốn tồn kho (đ)</th>
                      <th className="p-2 w-20 text-center border-r border-black">Tỷ trọng (%)</th>
                      <th className="p-2 w-32 text-right border-r border-black">Tổng giá trị bán (đ)</th>
                      <th className="p-2 w-20 text-center">Tồn TB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g, idx) => {
                      const isNegativeGroup = (g.totalStockQuantity || 0) < 0 && (g.totalInventoryValue || 0) <= 0;
                      return (
                        <tr key={g.groupId || idx} className="border-b border-slate-300">
                          <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-300">
                            {idx + 1}
                          </td>
                          <td className="p-1.5 font-bold border-r border-slate-300">
                            {g.groupName || "Chưa phân nhóm"}
                          </td>
                          <td className="p-1.5 text-center border-r border-slate-300">
                            {g.productCount}
                          </td>
                          <td className="p-1.5 text-right font-semibold border-r border-slate-300">
                            {isNegativeGroup ? (
                              <span className="text-rose-600 font-bold">
                                {formatNumber(g.totalStockQuantity)} (Âm)
                              </span>
                            ) : (
                              formatNumber(g.totalStockQuantity)
                            )}
                          </td>
                          <td className="p-1.5 text-right font-bold text-slate-900 border-r border-slate-300">
                            {isNegativeGroup ? "0 đ" : formatCurrency(g.totalInventoryValue || 0)}
                          </td>
                          <td className="p-1.5 text-center font-bold text-slate-700 border-r border-slate-300">
                            {isNegativeGroup ? "0%" : `${g.valuePercentage || 0}%`}
                          </td>
                          <td className="p-1.5 text-right text-slate-700 border-r border-slate-300">
                            {formatCurrency(g.totalRetailValue || 0)}
                          </td>
                          <td className="p-1.5 text-center text-slate-600">
                            {g.averageDaysInStock || 0} ngày
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-extrabold border-t-2 border-black text-[11px]">
                      <td colSpan={2} className="p-2 text-center uppercase border-r border-black">
                        Tổng cộng:
                      </td>
                      <td className="p-2 text-center border-r border-black">
                        {items.length}
                      </td>
                      <td className="p-2 text-right border-r border-black">
                        {formatNumber(totalGroupQty)}
                      </td>
                      <td className="p-2 text-right text-rose-700 border-r border-black">
                        {formatCurrency(totalValuation)}
                      </td>
                      <td className="p-2 text-center border-r border-black">
                        100%
                      </td>
                      <td className="p-2 text-right border-r border-black">
                        {formatCurrency(totalRetail)}
                      </td>
                      <td className="p-2 text-center">
                        —
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* 5. Section III: Detailed Items Table */}
            {(printScope === "all" || printScope === "items") && items.length > 0 && (
              <div className="mb-5">
                <div className="font-extrabold text-xs uppercase mb-1.5 flex items-center justify-between border-b border-black pb-0.5">
                  <span>III. DANH SÁCH CHI TIẾT TỒN KHO & GIÁ VỐN TỪNG MẶT HÀNG</span>
                  <span className="text-[10px] font-normal normal-case italic text-slate-600">
                    ({items.length} mặt hàng có giá vốn)
                  </span>
                </div>

                <table className="w-full text-[10px] border border-black text-left">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-black">
                      <th className="p-1.5 w-8 text-center border-r border-black">#</th>
                      <th className="p-1.5 w-24 border-r border-black">Mã SKU</th>
                      <th className="p-1.5 border-r border-black">Tên mặt hàng</th>
                      <th className="p-1.5 w-14 text-center border-r border-black">ĐVT</th>
                      <th className="p-1.5 w-18 text-right border-r border-black">SL Tồn</th>
                      <th className="p-1.5 w-24 text-right border-r border-black">Giá vốn (đ)</th>
                      <th className="p-1.5 w-28 text-right border-r border-black">Vốn tồn kho (đ)</th>
                      <th className="p-1.5 w-24 text-right border-r border-black">Giá bán lẻ (đ)</th>
                      <th className="p-1.5 w-28 text-right border-r border-black">Doanh thu dự kiến</th>
                      <th className="p-1.5 w-16 text-center">Lưu kho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const isNegative = (it.stockQuantity || 0) < 0 || it.isNegativeStock;
                      return (
                        <tr key={it.productId || idx} className="border-b border-slate-300">
                          <td className="p-1 text-center font-bold text-slate-500 border-r border-slate-300">
                            {idx + 1}
                          </td>
                          <td className="p-1 font-mono font-bold text-slate-800 border-r border-slate-300">
                            {it.sku || "—"}
                          </td>
                          <td className="p-1 font-bold text-slate-900 border-r border-slate-300">
                            {it.productName}
                            {it.groupName && (
                              <span className="block text-[9px] font-normal text-slate-500">
                                Nhóm: {it.groupName}
                              </span>
                            )}
                          </td>
                          <td className="p-1 text-center border-r border-slate-300">
                            {it.unit || "—"}
                          </td>
                          <td className="p-1 text-right font-semibold border-r border-slate-300">
                            {isNegative ? (
                              <span className="text-rose-600 font-bold">
                                {formatNumber(it.stockQuantity)} [Âm]
                              </span>
                            ) : (
                              formatNumber(it.stockQuantity)
                            )}
                          </td>
                          <td className="p-1 text-right text-slate-700 border-r border-slate-300">
                            {formatCurrency(it.costPrice || 0)}
                          </td>
                          <td className="p-1 text-right font-bold text-slate-900 border-r border-slate-300">
                            {isNegative ? "0 đ" : formatCurrency(it.inventoryValue || 0)}
                          </td>
                          <td className="p-1 text-right text-slate-700 border-r border-slate-300">
                            {formatCurrency(it.retailPrice || 0)}
                          </td>
                          <td className="p-1 text-right text-slate-700 border-r border-slate-300">
                            {isNegative ? "0 đ" : formatCurrency(it.retailValue || 0)}
                          </td>
                          <td className="p-1 text-center text-slate-600">
                            {it.daysInStock || 0} ngày
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-extrabold border-t-2 border-black text-[10.5px]">
                      <td colSpan={4} className="p-1.5 text-center uppercase border-r border-black">
                        Tổng cộng ({items.length} mặt hàng):
                      </td>
                      <td className="p-1.5 text-right border-r border-black">
                        {formatNumber(totalItemQty)}
                      </td>
                      <td className="p-1.5 text-right border-r border-black">—</td>
                      <td className="p-1.5 text-right text-rose-700 border-r border-black">
                        {formatCurrency(totalValuation)}
                      </td>
                      <td className="p-1.5 text-right border-r border-black">—</td>
                      <td className="p-1.5 text-right border-r border-black">
                        {formatCurrency(totalRetail)}
                      </td>
                      <td className="p-1.5 text-center">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* 6. Section IV: Missing Cost Items Warning (if any) */}
            {printScope === "all" && missingCostItems.length > 0 && (
              <div className="mb-5">
                <div className="font-extrabold text-xs uppercase mb-1.5 flex items-center justify-between border-b border-black pb-0.5">
                  <span className="text-amber-800">
                    IV. CẢNH BÁO: MẶT HÀNG TỒN KHO CHƯA CÓ GIÁ VỐN TỪ PHIẾU NHẬP
                  </span>
                  <span className="text-[10px] font-normal normal-case italic text-amber-800">
                    ({missingCostItems.length} mặt hàng - loại trừ khỏi tổng giá trị kho)
                  </span>
                </div>

                <table className="w-full text-[9.5px] border border-amber-300 text-left bg-amber-50/30">
                  <thead>
                    <tr className="bg-amber-100/70 font-bold border-b border-amber-300">
                      <th className="p-1 w-8 text-center border-r border-amber-300">#</th>
                      <th className="p-1 w-24 border-r border-amber-300">Mã SKU</th>
                      <th className="p-1 border-r border-amber-300">Tên mặt hàng</th>
                      <th className="p-1 w-16 text-center border-r border-amber-300">ĐVT</th>
                      <th className="p-1 w-20 text-right border-r border-amber-300">SL Tồn kho</th>
                      <th className="p-1 w-24 text-right border-r border-amber-300">Giá bán lẻ (đ)</th>
                      <th className="p-1">Tình trạng ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missingCostItems.map((m, idx) => (
                      <tr key={m.productId || idx} className="border-b border-amber-200">
                        <td className="p-1 text-center font-bold text-slate-500 border-r border-amber-200">
                          {idx + 1}
                        </td>
                        <td className="p-1 font-mono font-bold text-slate-700 border-r border-amber-200">
                          {m.sku || "—"}
                        </td>
                        <td className="p-1 font-semibold text-slate-800 border-r border-amber-200">
                          {m.productName}
                        </td>
                        <td className="p-1 text-center border-r border-amber-200">
                          {m.unit || "—"}
                        </td>
                        <td className="p-1 text-right font-bold text-slate-800 border-r border-amber-200">
                          {formatNumber(m.stockQuantity)}
                        </td>
                        <td className="p-1 text-right text-slate-700 border-r border-amber-200">
                          {formatCurrency(m.retailPrice || 0)}
                        </td>
                        <td className="p-1 text-amber-800 italic">
                          Chưa lập phiếu nhập (Giá vốn = 0 đ)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 7. Section V: Formal Vietnamese Accounting Signatures */}
            <div className="mt-8 pt-4 border-t border-black break-inside-avoid">
              <div className="text-right text-[11px] italic mb-3">
                {printDateStr.full}
              </div>

              <div className="grid grid-cols-3 text-center gap-4">
                <div>
                  <div className="font-extrabold uppercase text-[11px] tracking-wide">
                    Người lập báo cáo
                  </div>
                  <div className="text-[10px] italic text-slate-500 mt-0.5">
                    (Ký, ghi rõ họ tên)
                  </div>
                  <div className="h-20" />
                  <div className="font-bold text-[11px] text-slate-800">
                    Nguyễn Văn A
                  </div>
                </div>

                <div>
                  <div className="font-extrabold uppercase text-[11px] tracking-wide">
                    Thủ kho
                  </div>
                  <div className="text-[10px] italic text-slate-500 mt-0.5">
                    (Ký, ghi rõ họ tên)
                  </div>
                  <div className="h-20" />
                  <div className="font-bold text-[11px] text-slate-800">
                    .......................................
                  </div>
                </div>

                <div>
                  <div className="font-extrabold uppercase text-[11px] tracking-wide">
                    Chủ hộ kinh doanh
                  </div>
                  <div className="text-[10px] italic text-slate-500 mt-0.5">
                    (Ký, đóng dấu, ghi rõ họ tên)
                  </div>
                  <div className="h-20" />
                  <div className="font-bold text-[11px] text-slate-800 uppercase">
                    {household?.name || "HỘ KINH DOANH"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InventoryValuationPrintModal;
