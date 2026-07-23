import React, { useState, useEffect } from "react";
import { RotateCw, FileText, CheckCircle } from "lucide-react";
import { MOCK_INVOICES } from "@/constants/mockData/invoices";

interface IInvoice {
  lookupCode: string;
  symbol: string;
  customer: string;
  amount: number;
  taxAmount: number;
  finalAmount: number;
  status: string;
  taxAuthorityCode: string;
  time: string;
  invoiceNumber?: string;
}

export const LookupInvoicePage: React.FC = () => {
  const [lookupCode, setLookupCode] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [typedCaptcha, setTypedCaptcha] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [searchedInvoice, setSearchedInvoice] = useState<IInvoice | null>(null);

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
    setErrorMsg("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSearchedInvoice(null);

    if (!lookupCode.trim()) {
      setErrorMsg("Vui lòng nhập Mã nhận hóa đơn.");
      return;
    }
    if (!typedCaptcha.trim()) {
      setErrorMsg("Vui lòng nhập Mã kiểm tra.");
      return;
    }
    if (typedCaptcha.toUpperCase() !== captcha) {
      setErrorMsg("Mã kiểm tra không chính xác. Vui lòng thử lại.");
      generateCaptcha();
      setTypedCaptcha("");
      return;
    }

    const invoice = MOCK_INVOICES.find(
      (inv) => inv.lookupCode.toLowerCase() === lookupCode.trim().toLowerCase()
    );

    if (!invoice) {
      setErrorMsg(
        "Không tìm thấy hóa đơn tương ứng với mã vừa nhập. Vui lòng kiểm tra lại!"
      );
      generateCaptcha();
      setTypedCaptcha("");
      return;
    }

    setSearchedInvoice(invoice);
  };

  const handlePrint = () => window.print();

  const formatCurrency = (val: number) =>
    val.toLocaleString("vi-VN") + " đ";

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8] font-sans text-[13px] text-kv-text-dark">
      {/* ─── HEADER BANNER ─── */}
      <header className="bg-kv-blue-primary">
        <div className="max-w-[980px] mx-auto w-full flex items-center gap-4 px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-0.5 text-white shrink-0">
            <span className="font-black text-2xl tracking-tighter whitespace-nowrap">
              Bán Hàng
            </span>
            <span className="bg-white text-kv-blue-primary font-black text-lg px-1.5 py-0.5 leading-tight rounded-sm ml-1 whitespace-nowrap">
              Việt
            </span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-white/35 shrink-0" />

          {/* Tagline */}
          <span className="hidden sm:block text-white/90 text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap">
            Phần mềm bán hàng &amp; hóa đơn điện tử hộ kinh doanh
          </span>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 max-w-[980px] mx-auto w-full px-4 py-6">
        {/* Top card: Form wrapper */}
        <div className="bg-white border border-[#dce3ec] shadow-sm">
          {/* ── LEFT: Search Form ── */}
          <div className="flex-1 p-10 md:p-12">
            <h1 className="text-center mb-6 text-base font-medium text-kv-text-body tracking-wider">
              TRA CỨU HÓA ĐƠN ĐIỆN TỬ CỦA BẠN
            </h1>
            <div className="h-px bg-[#dce3ec] mb-7" />

            <form onSubmit={handleLookup}>
              {/* Field 1 */}
              <div className="flex items-start mb-6">
                <label className="w-40 pt-2.5 text-right pr-3 text-kv-text-body font-medium shrink-0 text-xs">
                  Mã nhận hóa đơn{" "}
                  <span className="text-kv-blue-primary">(*)</span>
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value)}
                    placeholder="Ví dụ: HD-VT001, HD-VT002..."
                    className="w-full max-w-[340px] h-[38px] px-3 border border-[#dce3ec] rounded text-sm outline-none text-kv-text-dark focus:border-kv-blue-primary transition-colors"
                  />
                  <div className="mt-1">
                    <span
                      className="text-[11px] text-kv-blue-primary cursor-pointer hover:underline"
                    >
                      ( Hướng dẫn cách lấy mã nhận hóa đơn tại đây )
                    </span>
                  </div>
                </div>
              </div>

              {/* Field 2: Captcha */}
              <div className="flex items-center mb-6">
                <label className="w-40 text-right pr-3 text-kv-text-body font-medium shrink-0 text-xs">
                  Mã kiểm tra:{" "}
                  <span className="text-kv-blue-primary">(*)</span>
                </label>
                <div className="flex items-center gap-2">
                  {/* Captcha display */}
                  <div className="w-[90px] h-[38px] bg-kv-blue-light border border-[#bfd4ff] flex items-center justify-center font-mono font-bold text-base text-kv-blue-dark tracking-widest select-none rounded">
                    {captcha}
                  </div>

                  {/* Refresh */}
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    title="Đổi mã kiểm tra"
                    className="bg-transparent border-none cursor-pointer p-0 flex items-center text-kv-blue-primary hover:text-kv-blue-dark transition-colors"
                  >
                    <RotateCw style={{ width: 16, height: 16 }} />
                  </button>

                  {/* Input */}
                  <input
                    type="text"
                    value={typedCaptcha}
                    onChange={(e) => setTypedCaptcha(e.target.value)}
                    maxLength={5}
                    placeholder="Nhập mã..."
                    className="w-[150px] h-[38px] px-3 border border-[#dce3ec] rounded text-sm text-kv-text-dark uppercase tracking-widest outline-none focus:border-kv-blue-primary transition-colors"
                  />
                </div>
              </div>

              {/* Error message */}
              {errorMsg && (
                <div className="flex items-start mb-3">
                  <div className="w-40 shrink-0" />
                  <div className="text-rose-600 text-xs font-medium bg-rose-50 border border-rose-200 rounded px-3 py-1.5">
                    {errorMsg}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center">
                <div className="w-40 shrink-0" />
                <button
                  type="submit"
                  className="bg-kv-blue-primary text-white border-none py-2.5 px-7 text-sm font-bold cursor-pointer rounded hover:bg-kv-blue-dark transition-colors"
                >
                  Xem hóa đơn
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── RESULT SECTION ── */}
        {searchedInvoice && (
          <div className="mt-5 bg-white border border-[#dce3ec] shadow-sm">
            {/* Result toolbar */}
            <div className="flex justify-between items-center px-5 py-2.5 border-b border-[#dce3ec] bg-kv-blue-light">
              <div className="flex items-center gap-2 text-kv-green font-semibold text-[13px]">
                <FileText style={{ width: 16, height: 16 }} />
                Đã tìm thấy hóa đơn:{" "}
                <strong className="text-kv-text-dark">
                  {searchedInvoice.lookupCode}
                </strong>
              </div>
              <button
                onClick={handlePrint}
                className="bg-kv-green text-white border-none py-1.5 px-4 text-xs font-bold cursor-pointer rounded flex items-center gap-1.5 hover:bg-emerald-600 transition-colors print:hidden"
              >
                🖨️ In hóa đơn
              </button>
            </div>

            {/* Invoice body */}
            <div className="p-6 max-w-[760px] mx-auto">
              {/* Invoice header */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-kv-text-dark">
                <div>
                  <div className="text-kv-blue-primary font-black text-sm uppercase">
                    Hộ Kinh Doanh Bán Hàng Việt
                  </div>
                  <div className="text-[11px] mt-1 text-kv-text-body">
                    <strong>Mã số thuế:</strong> 0102030405
                  </div>
                  <div className="text-[11px] text-kv-text-body">
                    <strong>Địa chỉ:</strong> Số 123 Nguyễn Trãi, Thanh Xuân, Hà Nội
                  </div>
                  <div className="text-[11px] text-kv-text-body">
                    <strong>Điện thoại:</strong> 024.1234.5678 &nbsp;
                    <strong>Email:</strong> support@banhangviet.vn
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="font-black text-sm uppercase text-kv-text-dark">
                    Hóa đơn giá trị gia tăng
                  </div>
                  <div className="text-[11px] text-kv-text-muted italic">
                    (Bản thể hiện hóa đơn điện tử)
                  </div>
                  <div className="text-[11px] mt-1 text-kv-text-body">
                    <strong>Ký hiệu:</strong> {searchedInvoice.symbol}
                  </div>
                  <div className="text-[11px] text-kv-text-body">
                    <strong>Số hóa đơn:</strong>{" "}
                    {searchedInvoice.invoiceNumber ?? "00000024"}
                  </div>
                  <div className="text-[11px] text-kv-text-body">
                    <strong>Ngày:</strong> {searchedInvoice.time}
                  </div>
                </div>
              </div>

              {/* Buyer info */}
              <div className="py-3 border-b border-[#dce3ec] text-[11px] text-kv-text-body">
                <div className="flex gap-8 mb-1">
                  <div>
                    <strong>Đơn vị mua:</strong> {searchedInvoice.customer}
                  </div>
                  <div>
                    <strong>MST người mua:</strong> --
                  </div>
                </div>
                <div className="flex gap-8">
                  <div>
                    <strong>Địa chỉ:</strong> --
                  </div>
                  <div>
                    <strong>Hình thức TT:</strong> Tiền mặt / Chuyển khoản
                  </div>
                </div>
              </div>

              {/* Items table */}
              <div className="mt-3">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-kv-blue-light">
                      {[
                        "STT",
                        "Tên hàng hóa, dịch vụ",
                        "ĐVT",
                        "Số lượng",
                        "Đơn giá",
                        "Thành tiền",
                      ].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            border: `1px solid #bfd4ff`,
                            textAlign: i > 2 ? "right" : "left",
                          }}
                          className="p-2 font-bold text-kv-blue-dark"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-[#dce3ec] p-2 text-center text-kv-text-body">
                        1
                      </td>
                      <td className="border border-[#dce3ec] p-2 text-kv-text-dark">
                        Thiết bị di động thông minh (Mặt hàng mô phỏng)
                      </td>
                      <td className="border border-[#dce3ec] p-2 text-center text-kv-text-body">
                        Cái
                      </td>
                      <td className="border border-[#dce3ec] p-2 text-center text-kv-text-body">
                        1
                      </td>
                      <td className="border border-[#dce3ec] p-2 text-right font-semibold text-kv-text-dark">
                        {formatCurrency(searchedInvoice.amount)}
                      </td>
                      <td className="border border-[#dce3ec] p-2 text-right font-semibold text-kv-text-dark">
                        {formatCurrency(searchedInvoice.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-3 text-[11px] text-kv-text-body">
                <div className="flex justify-between py-1.25 border-b border-[#dce3ec]">
                  <span>Cộng tiền hàng trước thuế:</span>
                  <strong className="text-kv-text-dark">
                    {formatCurrency(searchedInvoice.amount)}
                  </strong>
                </div>
                <div className="flex justify-between py-1.25 border-b border-[#dce3ec] text-kv-orange">
                  <span>Thuế suất GTGT (8%):</span>
                  <strong>{formatCurrency(searchedInvoice.taxAmount)}</strong>
                </div>
                <div className="flex justify-between py-1.75 border-t-2 border-kv-text-dark mt-0.5 font-bold text-xs">
                  <span className="text-kv-text-dark">
                    Tổng cộng tiền thanh toán:
                  </span>
                  <span className="text-kv-blue-primary text-[13px]">
                    {formatCurrency(searchedInvoice.finalAmount)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex justify-between mt-6 text-[11px]">
                <div className="text-center min-w-[150px]">
                  <div className="font-bold text-kv-text-dark mb-12">
                    NGƯỜI MUA HÀNG
                  </div>
                  <div className="text-kv-text-muted italic">(Ký, ghi rõ họ tên)</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="font-bold text-kv-text-dark mb-2">
                    NGƯỜI BÁN HÀNG
                  </div>
                  <div className="border-2 border-dashed border-kv-green bg-[#f0faf5] rounded-md p-3 inline-flex flex-col items-center gap-1">
                    <CheckCircle
                      style={{ width: 18, height: 18 }}
                      className="text-kv-green"
                    />
                    <span className="font-bold text-[#1a6040] text-[10px]">
                      ĐÃ KÝ SỐ ĐIỆN TỬ
                    </span>
                    <span className="text-[#2d8e65] text-[10px]">
                      Bởi: Hộ KD Bán Hàng Việt
                    </span>
                    <span className="text-kv-text-muted text-[9px]">
                      Ngày ký: {searchedInvoice.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tax authority code */}
              {searchedInvoice.taxAuthorityCode &&
                searchedInvoice.taxAuthorityCode !== "-" && (
                  <div className="mt-4 text-center bg-kv-blue-light border border-[#bfd4ff] p-2 rounded text-[11px] text-kv-blue-dark font-semibold">
                    🛡️ Mã cơ quan thuế cấp:{" "}
                    <strong className="text-kv-text-dark">
                      {searchedInvoice.taxAuthorityCode}
                    </strong>
                  </div>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LookupInvoicePage;
