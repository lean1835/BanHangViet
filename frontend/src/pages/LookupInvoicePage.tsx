import React, { useState, useEffect, useCallback } from "react";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  RotateCw,
  FileText,
  Download,
  Printer,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { message } from "antd";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useLazyLookupInvoicePublicQuery } from "@/modules/e_invoice/services/invoiceDeliveryApi";
import { convertNumberToWords } from "@/modules/e_invoice/utils/eInvoiceHelpers";
import type { IPublicInvoiceItem } from "@/modules/e_invoice/types/IInvoiceDelivery";
import { formatCurrency } from "@/utils/formatCurrency";

interface ILookupDisplayInvoice {
  lookupCode: string;
  symbol: string;
  invoiceNumber: string;
  householdName: string;
  householdTaxCode: string;
  householdAddress: string;
  customer: string;
  buyerTaxCode?: string;
  buyerAddress?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  amount: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  taxAuthorityCode: string;
  time: string;
  items?: IPublicInvoiceItem[];
}

export const LookupInvoicePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [lookupCode, setLookupCode] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [typedCaptcha, setTypedCaptcha] = useState("");

  const [codeError, setCodeError] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [searchedInvoice, setSearchedInvoice] = useState<ILookupDisplayInvoice | null>(null);

  const [triggerLookup, { isFetching }] = useLazyLookupInvoicePublicQuery();

  const generateCaptcha = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  }, []);

  const executeSearch = useCallback(
    async (codeToSearch: string) => {
      setCodeError("");
      setCaptchaError("");
      setSearchedInvoice(null);

      const cleanCode = codeToSearch.trim().toUpperCase();
      if (!cleanCode) {
        setCodeError("Vui lòng nhập Mã nhận hóa đơn.");
        return;
      }

      try {
        const res = await triggerLookup({ code: cleanCode }).unwrap();
        if (res && res.result) {
          const data = res.result;
          const formattedDate = data.createdAt
            ? new Date(data.createdAt).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "-";

          const itemsList = data.items && data.items.length > 0 ? data.items : undefined;
          const preTaxAmount =
            data.totalAmountBeforeTax ??
            (itemsList
              ? itemsList.reduce((acc, it) => acc + (it.subtotal || it.unitPrice * it.quantity), 0)
              : data.finalAmount - (data.taxAmount || 0));

          setSearchedInvoice({
            lookupCode: cleanCode,
            symbol: data.invoiceSymbol || data.invoicePattern || "-",
            invoiceNumber: data.invoiceNumber || "Chưa cấp",
            householdName: data.householdName || "-",
            householdTaxCode: data.householdTaxCode || "-",
            householdAddress: data.householdAddress || "-",
            customer: data.buyerName || "Khách mua lẻ",
            buyerTaxCode: data.buyerTaxCode || "-",
            buyerAddress: data.buyerAddress || "-",
            buyerPhone: data.buyerPhone || "-",
            buyerEmail: data.buyerEmail || "-",
            amount: preTaxAmount,
            taxAmount: data.taxAmount ?? Math.round(preTaxAmount * 0.08),
            discountAmount: data.discountAmount || 0,
            finalAmount: data.finalAmount || preTaxAmount + (data.taxAmount || 0),
            status: data.status || "ISSUED",
            taxAuthorityCode: data.taxAuthorityCode || "-",
            time: formattedDate,
            items: itemsList,
          });
        }
      } catch (err: unknown) {
        const apiErrObj = err as { data?: { message?: string }; message?: string };
        const apiErrorMsg = apiErrObj?.data?.message || apiErrObj?.message;
        setCodeError(
          apiErrorMsg || "Không tìm thấy hóa đơn tương ứng với mã vừa nhập. Vui lòng kiểm tra lại!"
        );
        generateCaptcha();
        setTypedCaptcha("");
      }
    },
    [triggerLookup, generateCaptcha]
  );

  useEffect(() => {
    generateCaptcha();
    const urlCode = searchParams.get("code") || searchParams.get("lookupCode");
    if (urlCode) {
      setLookupCode(urlCode);
      executeSearch(urlCode);
    }
  }, [searchParams, executeSearch, generateCaptcha]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    setCaptchaError("");

    let hasErr = false;

    if (!lookupCode.trim()) {
      setCodeError("Vui lòng nhập Mã nhận hóa đơn.");
      hasErr = true;
    }
    if (!typedCaptcha.trim()) {
      setCaptchaError("Vui lòng nhập Mã kiểm tra.");
      hasErr = true;
    } else if (typedCaptcha.toUpperCase() !== captcha) {
      setCaptchaError("Mã kiểm tra không chính xác. Vui lòng thử lại.");
      generateCaptcha();
      setTypedCaptcha("");
      hasErr = true;
    }

    if (hasErr) return;

    executeSearch(lookupCode);
  };

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!searchedInvoice) return;

    const invoiceElement = document.getElementById("invoice-document-card");
    if (!invoiceElement) {
      message.error("Không tìm thấy khung hóa đơn để xuất PDF.");
      return;
    }

    const hideLoadingMsg = message.loading("Đang tạo tệp PDF hóa đơn...", 0);

    try {
      const canvas = await html2canvas(invoiceElement, {
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

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`HoaDon_${searchedInvoice.lookupCode}.pdf`);
      hideLoadingMsg();
      message.success(`Đã tải xuống tệp HoaDon_${searchedInvoice.lookupCode}.pdf thành công!`);
    } catch {
      hideLoadingMsg();
      message.error("Có lỗi xảy ra khi tạo tệp PDF. Vui lòng thử lại!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8] font-sans text-[13px] text-kv-text-dark">
      {/* ─── HEADER BANNER ─── */}
      <header className="bg-kv-blue-primary print:hidden">
        <div className="max-w-[980px] mx-auto w-full flex items-center gap-4 px-6 py-3">
          {/* Logo */}
          <BrandLogo size="lg" variant="light" />

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-white/35 shrink-0" />

          {/* Tagline */}
          <span className="hidden sm:block text-white/90 text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap">
            Phần mềm bán hàng &amp; hóa đơn điện tử hộ kinh doanh
          </span>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 max-w-[980px] mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {/* Top card: Form wrapper */}
        <div className="bg-white border border-[#dce3ec] shadow-sm print:hidden rounded-lg overflow-hidden">
          {/* ── Search Form ── */}
          <div className="flex-1 p-8 md:p-10">
            <h1 className="text-center mb-6 text-base font-bold text-kv-text-dark tracking-wider uppercase flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-kv-blue-primary shrink-0" />
              <span>Tra Cứu &amp; Tải Hóa Đơn Điện Tử Khách Hàng</span>
            </h1>
            <div className="h-px bg-[#dce3ec] mb-7" />

            <form onSubmit={handleLookup}>
              {/* Field 1: Lookup Code */}
              <div className="flex items-start mb-6">
                <label className="w-40 pt-2.5 text-right pr-3 text-kv-text-body font-medium shrink-0 text-xs">
                  Mã nhận hóa đơn <span className="text-kv-blue-primary">(*)</span>
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={lookupCode}
                    onChange={(e) => {
                      setLookupCode(e.target.value);
                      if (codeError) setCodeError("");
                    }}
                    placeholder="Nhập mã tra cứu 10 ký tự (Ví dụ: EB8BBD6893)..."
                    className={`w-full max-w-[340px] h-[38px] px-3 border rounded text-sm outline-none text-kv-text-dark font-mono uppercase transition-colors ${
                      codeError
                        ? "border-rose-500 focus:border-rose-500 bg-rose-50/20"
                        : "border-[#dce3ec] focus:border-kv-blue-primary"
                    }`}
                  />
                  {codeError ? (
                    <div className="mt-1.5 text-rose-600 text-xs font-semibold flex items-center gap-1">
                      <span>⚠️ {codeError}</span>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <span className="text-[11px] text-kv-blue-primary">
                        ( Nhập mã tra cứu 10 ký tự trên hóa đơn hoặc phiếu tính tiền )
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Field 2: Captcha */}
              <div className="flex items-start mb-6">
                <label className="w-40 pt-2 text-right pr-3 text-kv-text-body font-medium shrink-0 text-xs">
                  Mã kiểm tra: <span className="text-kv-blue-primary">(*)</span>
                </label>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {/* Captcha display */}
                    <div className="w-[90px] h-[38px] bg-kv-blue-light border border-[#bfd4ff] flex items-center justify-center font-mono font-bold text-base text-kv-blue-dark tracking-widest select-none rounded">
                      {captcha}
                    </div>

                    {/* Refresh */}
                    <button
                      type="button"
                      onClick={() => {
                        generateCaptcha();
                        if (captchaError) setCaptchaError("");
                      }}
                      title="Đổi mã kiểm tra"
                      className="bg-transparent border-none cursor-pointer p-0 flex items-center text-kv-blue-primary hover:text-kv-blue-dark transition-colors"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    {/* Input */}
                    <input
                      type="text"
                      value={typedCaptcha}
                      onChange={(e) => {
                        setTypedCaptcha(e.target.value);
                        if (captchaError) setCaptchaError("");
                      }}
                      maxLength={5}
                      placeholder="Nhập mã..."
                      className={`w-[150px] h-[38px] px-3 border rounded text-sm text-kv-text-dark uppercase tracking-widest outline-none transition-colors font-mono ${
                        captchaError
                          ? "border-rose-500 focus:border-rose-500 bg-rose-50/20"
                          : "border-[#dce3ec] focus:border-kv-blue-primary"
                      }`}
                    />
                  </div>

                  {captchaError && (
                    <div className="mt-1.5 text-rose-600 text-xs font-semibold flex items-center gap-1">
                      <span>⚠️ {captchaError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center">
                <div className="w-40 shrink-0" />
                <button
                  type="submit"
                  disabled={isFetching}
                  className="bg-kv-blue-primary text-white border-none py-2.5 px-7 text-sm font-bold cursor-pointer rounded hover:bg-kv-blue-dark transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tra cứu...</span>
                    </>
                  ) : (
                    <span>Tra cứu hóa đơn</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── RESULT SECTION (Exact match with InvoiceDetailModal) ── */}
        {searchedInvoice && (
          <div className="mt-5 bg-white border border-[#dce3ec] shadow-sm rounded-xl overflow-hidden">
            {/* Result toolbar */}
            <div className="flex flex-wrap justify-between items-center px-4 sm:px-5 py-3 border-b border-[#dce3ec] bg-kv-blue-light print:hidden gap-2">
              <div className="flex items-center gap-2 text-kv-green font-semibold text-[13px] min-w-0">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  Đã tìm thấy hóa đơn:{" "}
                  <strong className="text-kv-text-dark font-mono">
                    {searchedInvoice.lookupCode}
                  </strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="bg-kv-blue-primary text-white border-none py-1.5 px-3 text-xs font-bold cursor-pointer rounded flex items-center gap-1 hover:bg-kv-blue-dark transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải Hóa Đơn (PDF)
                </button>

                <button
                  onClick={handlePrint}
                  className="bg-kv-green text-white border-none py-1.5 px-3 text-xs font-bold cursor-pointer rounded flex items-center gap-1 hover:bg-emerald-600 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In hóa đơn
                </button>
              </div>
            </div>

            {/* Invoice card body (Standard E-Invoice Template from InvoiceDetailModal) */}
            <div
              id="invoice-document-card"
              className="p-4 sm:p-6 max-w-[800px] mx-auto bg-white relative flex flex-col gap-6 text-[10px] text-slate-800 font-medium overflow-hidden"
            >
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] text-slate-800 text-[3.5rem] font-extrabold rotate-[30deg] uppercase whitespace-nowrap overflow-hidden">
                Hóa đơn điện tử
              </div>

              {/* Invoice Header */}
              <div className="flex justify-between border-b pb-4 flex-wrap gap-4">
                <div>
                  <h1 className="text-sm font-extrabold text-kv-blue-primary tracking-wide">
                    HÓA ĐƠN GIÁ TRỊ GIA TĂNG
                  </h1>
                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                    (Bản thể hiện hóa đơn điện tử)
                  </p>
                  <p className="text-[10px] font-bold text-slate-600 mt-2 flex items-center gap-2">
                    <span>Ngày lập: {searchedInvoice.time}</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold border bg-emerald-100 text-emerald-800 border-emerald-300">
                      Đã phát hành
                    </span>
                  </p>
                </div>
                <div className="text-right flex flex-col gap-0.5 font-bold text-slate-600 text-[10px]">
                  <p>Mẫu số: <span className="text-slate-800 font-extrabold">1</span></p>
                  <p>Ký hiệu: <span className="text-slate-800 font-extrabold">{searchedInvoice.symbol}</span></p>
                  <p>Số HĐ: <span className="text-kv-blue-primary font-mono font-extrabold">{searchedInvoice.invoiceNumber}</span></p>
                  <p>Mã tra cứu: <span className="text-slate-800 font-mono font-extrabold">{searchedInvoice.lookupCode}</span></p>
                </div>
              </div>

              {/* Seller Info */}
              <div className="border-b pb-3 text-[10px] leading-relaxed text-slate-600">
                <p className="font-extrabold text-slate-800 text-xs uppercase mb-1">
                  Đơn vị bán hàng: {searchedInvoice.householdName}
                </p>
                <p>Mã số thuế: <span className="font-bold text-slate-800">{searchedInvoice.householdTaxCode}</span></p>
                <p>Địa chỉ: {searchedInvoice.householdAddress}</p>
                <p>Email hỗ trợ: support@banhangviet.vn</p>
              </div>

              {/* Buyer Info */}
              <div className="border-b pb-3 text-[10px] leading-relaxed text-slate-600">
                <p className="font-extrabold text-slate-800 text-xs uppercase mb-1">Thông tin người mua hàng</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <p>Họ tên người mua: <span className="font-bold text-slate-800">{searchedInvoice.customer}</span></p>
                  <p>Mã số thuế: <span className="font-bold text-slate-800">{searchedInvoice.buyerTaxCode}</span></p>
                  <p className="sm:col-span-2">Địa chỉ: {searchedInvoice.buyerAddress}</p>
                  <p>Điện thoại: {searchedInvoice.buyerPhone}</p>
                  <p>Email: {searchedInvoice.buyerEmail}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="flex-1">
                <table className="w-full text-left border-collapse border border-slate-200 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[9px] uppercase">
                      <th className="p-2 border-r border-slate-200 text-center w-8">STT</th>
                      <th className="p-2 border-r border-slate-200">Tên hàng hóa, dịch vụ</th>
                      <th className="p-2 border-r border-slate-200 text-center w-12">ĐVT</th>
                      <th className="p-2 border-r border-slate-200 text-center w-12">SL</th>
                      <th className="p-2 border-r border-slate-200 text-right w-20">Đơn giá</th>
                      <th className="p-2 border-r border-slate-200 text-center w-14">Thuế (%)</th>
                      <th className="p-2 text-right w-24">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-semibold">
                    {searchedInvoice.items && searchedInvoice.items.length > 0 ? (
                      searchedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-bold text-slate-800">{item.productName}</td>
                          <td className="p-2 border-r border-slate-200 text-center text-slate-500">{item.unit || "Cái"}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">{item.quantity}</td>
                          <td className="p-2 border-r border-slate-200 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="p-2 border-r border-slate-200 text-center text-slate-500">{item.taxRatePercentage || 8}%</td>
                          <td className="p-2 text-right font-bold text-slate-800">{formatCurrency(item.subtotal || item.unitPrice * item.quantity)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-2 border-r border-slate-200 text-center">1</td>
                        <td className="p-2 border-r border-slate-200 font-bold text-slate-800">Sản phẩm / Hàng hóa bán lẻ</td>
                        <td className="p-2 border-r border-slate-200 text-center text-slate-500">Cái</td>
                        <td className="p-2 border-r border-slate-200 text-center font-bold">1</td>
                        <td className="p-2 border-r border-slate-200 text-right">{formatCurrency(searchedInvoice.amount)}</td>
                        <td className="p-2 border-r border-slate-200 text-center text-slate-500">8%</td>
                        <td className="p-2 text-right font-bold text-slate-800">{formatCurrency(searchedInvoice.amount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Area */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2 font-bold text-slate-700 text-xs">
                <div className="flex justify-between text-[10px]">
                  <span className="font-semibold text-slate-500">Cộng tiền hàng (Chưa thuế):</span>
                  <span>{formatCurrency(searchedInvoice.amount)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="font-semibold text-slate-500">Tổng tiền thuế GTGT:</span>
                  <span>{formatCurrency(searchedInvoice.taxAmount)}</span>
                </div>
                {searchedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-[10px] text-rose-500">
                    <span className="font-semibold">Chiết khấu thương mại:</span>
                    <span>-{formatCurrency(searchedInvoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-950">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="font-extrabold text-kv-blue-primary">{formatCurrency(searchedInvoice.finalAmount)}</span>
                </div>
                <div className="border-t border-dashed border-slate-200 pt-2 text-[9px] font-semibold text-slate-500 italic leading-relaxed">
                  Số tiền viết bằng chữ: <span className="text-slate-800 font-bold not-italic">{convertNumberToWords(searchedInvoice.finalAmount)}</span>
                </div>
              </div>

              {/* Digital Signatures Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-4 border-t border-slate-100">
                {/* Buyer column */}
                <div className="flex flex-col items-center text-center">
                  <span className="font-extrabold text-[10px] text-slate-700 uppercase tracking-wide">Người mua hàng</span>
                  <span className="text-[8px] text-slate-400 mt-0.5 italic">(Ký, ghi rõ họ tên)</span>
                  <div className="h-16 flex items-center justify-center text-slate-300 font-semibold text-[9px] italic">
                    (Ký số điện tử)
                  </div>
                </div>

                {/* Seller column */}
                <div className="flex flex-col items-center text-center relative">
                  <span className="font-extrabold text-[10px] text-slate-700 uppercase tracking-wide">Người bán hàng</span>
                  <span className="text-[8px] text-slate-400 mt-0.5 italic">(Ký, đóng dấu điện tử)</span>
                  
                  <div className="mt-2.5 px-3 py-2 border-2 border-rose-500 rounded bg-rose-50/40 text-[8px] text-rose-700 font-bold flex flex-col items-center gap-0.5 rotate-[-2deg] shadow-sm max-w-[180px] leading-normal select-none">
                    <span className="text-[9px] text-rose-600 flex items-center gap-1 font-black">
                      🛡️ ĐÃ KÝ SỐ ĐIỆN TỬ
                    </span>
                    <span className="uppercase tracking-wide text-[7px] text-rose-600">{searchedInvoice.householdName}</span>
                    <span>MST: {searchedInvoice.householdTaxCode}</span>
                    <span>Ngày ký: {searchedInvoice.time}</span>
                  </div>
                </div>

                {/* Tax Authority Stamp for ISSUED invoices */}
                {searchedInvoice.taxAuthorityCode && searchedInvoice.taxAuthorityCode !== "-" && (
                  <div className="col-span-1 sm:col-span-2 flex justify-center mt-2">
                    <div className="px-4 py-2 border-2 border-emerald-500 rounded bg-emerald-50/40 text-[8px] text-emerald-800 font-bold flex items-center gap-3 rotate-[1deg] shadow-sm max-w-[320px] leading-normal select-none">
                      <span className="text-[12px] text-emerald-600 font-black">✓</span>
                      <div className="flex flex-col text-left">
                        <span className="font-black uppercase tracking-wider text-[9px]">MÃ CƠ QUAN THUẾ CẤP</span>
                        <span className="font-mono text-[9px] tracking-wider text-slate-800 font-extrabold">{searchedInvoice.taxAuthorityCode}</span>
                        <span>Ngày cấp: {searchedInvoice.time}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LookupInvoicePage;
