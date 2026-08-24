import React from "react";
import type {
  ITaxDeclarationPeriodResponse,
  ITaxRevenueSummaryResponse,
} from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";
import { numberToVietnameseWords } from "@/utils/numberToVietnameseWords";

interface ISimulatedTaxForm01Props {
  period?: ITaxDeclarationPeriodResponse;
  revenueSummary?: ITaxRevenueSummaryResponse;
  householdData?: {
    name: string;
    taxCode: string;
    representativeName?: string;
    address: string;
    phoneNumber: string;
  };
  id?: string;
}

export const SimulatedTaxForm01: React.FC<ISimulatedTaxForm01Props> = ({
  period,
  revenueSummary,
  householdData,
  id = "tax-declaration-form-simulation",
}) => {
  const taxCode = householdData?.taxCode || "8123456789";
  const taxCodeChars = taxCode.padEnd(10, " ").split("").slice(0, 10);
  const totalRevenue = revenueSummary?.totalRevenue ?? period?.totalRevenue ?? 0;
  const totalTaxAmount = revenueSummary?.totalTaxAmount ?? period?.totalTaxAmount ?? 0;
  const vatAmountEstimated = totalTaxAmount * (1.0 / 1.5);
  const pitAmountEstimated = totalTaxAmount * (0.5 / 1.5);

  const taxRateSummaries = revenueSummary?.taxRateSummaries || [];

  return (
    <div
      id={id}
      className="bg-white p-8 md:p-12 text-slate-900 font-sans border border-slate-300 shadow-sm max-w-4xl mx-auto rounded-2xl print:shadow-none print:border-none"
      style={{ minHeight: "1120px" }}
    >
      {/* 1. Header Quốc hiệu & Tiêu ngữ */}
      <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-300 pb-4 text-xs font-semibold">
        <div className="text-left mb-2 sm:mb-0">
          <p className="font-bold uppercase tracking-wider text-slate-700">
            CHI CỤC THUẾ KHU VỰC QUẢN LÝ
          </p>
          <p className="text-slate-500 italic mt-0.5">
            Hệ thống Bán Hàng Việt - Phiên bản kê khai 2026
          </p>
        </div>
        <div className="text-center sm:text-right">
          <p className="font-extrabold uppercase text-slate-800 tracking-wide">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </p>
          <p className="font-bold text-slate-700 underline underline-offset-4 mt-0.5">
            Độc lập - Tự do - Hạnh phúc
          </p>
        </div>
      </div>

      {/* 2. Tiêu đề Tờ khai */}
      <div className="text-center my-6">
        <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide">
          TỜ KHAI THUẾ ĐỐI VỚI HỘ KINH DOANH, CÁ NHÂN KINH DOANH
        </h1>
        <p className="text-xs font-bold text-slate-600 italic mt-1">
          (Mẫu số: 01/CNKD - Ban hành kèm theo Thông tư số 40/2021/TT-BTC)
        </p>
        <div className="flex items-center justify-center gap-6 mt-3 text-xs font-bold text-slate-700">
          <span>
            Kỳ tính thuế: <strong className="text-blue-600">{period?.periodName || "Quý 3/2026"}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border border-slate-700 flex items-center justify-center text-[10px] bg-slate-100">
              ✓
            </span>{" "}
            Lần đầu
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3.5 h-3.5 border border-slate-400 flex items-center justify-center text-[10px]"></span>{" "}
            Bổ sung
          </span>
        </div>
      </div>

      {/* 3. Thông tin Người nộp thuế */}
      <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 mb-6 text-xs space-y-2.5">
        <div className="flex items-center">
          <span className="font-bold w-56 text-slate-700">[01] Tên người nộp thuế / Hộ KD:</span>
          <span className="font-extrabold text-slate-900 uppercase">
            {householdData?.name || "Hộ kinh doanh Bán Hàng Việt"}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-bold w-56 text-slate-700">[02] Mã số thuế:</span>
          <div className="flex items-center gap-1">
            {taxCodeChars.map((char, index) => (
              <span
                key={index}
                className="w-5 h-6 border border-slate-400 bg-white flex items-center justify-center font-mono font-bold text-xs text-slate-900 rounded shadow-xs"
              >
                {char.trim()}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <span className="font-bold w-56 text-slate-700">
            [03] Người đại diện hộ kinh doanh:
          </span>
          <span className="font-bold text-slate-900">
            {householdData?.representativeName || (
              <span className="text-rose-500 italic font-normal">
                (Chưa cập nhật - Bắt buộc khai báo)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-bold w-56 text-slate-700">[04] Địa chỉ kinh doanh:</span>
          <span className="text-slate-800">{householdData?.address || "Số 123 Trần Phú, Hải Châu, Đà Nẵng"}</span>
        </div>

        <div className="flex items-center">
          <span className="font-bold w-56 text-slate-700">[05] Điện thoại liên hệ:</span>
          <span className="text-slate-800">{householdData?.phoneNumber || "0905123456"}</span>
        </div>
      </div>

      {/* 4. Bảng Kê Khai Thuế Theo Mức Thuế Suất */}
      <div className="mb-6">
        <h3 className="text-xs font-black uppercase text-slate-800 mb-2">
          A. NGHĨA VỤ THUẾ PHÁT SINH TRONG KỲ (TỰ TÍNH TOÁN TỪ HÓA ĐƠN ĐIỆN TỬ HỢP LỆ)
        </h3>
        <div className="overflow-x-auto border border-slate-300 rounded-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2.5 border-r border-slate-300 text-center w-10">STT</th>
                <th className="p-2.5 border-r border-slate-300">Nhóm ngành nghề / Thuế suất</th>
                <th className="p-2.5 border-r border-slate-300 text-right">Doanh thu chịu thuế</th>
                <th className="p-2.5 border-r border-slate-300 text-center w-16">Thuế GTGT</th>
                <th className="p-2.5 border-r border-slate-300 text-right">Tiền thuế GTGT (1%)</th>
                <th className="p-2.5 border-r border-slate-300 text-center w-16">Thuế TNCN</th>
                <th className="p-2.5 border-r border-slate-300 text-right">Tiền thuế TNCN (0.5%)</th>
                <th className="p-2.5 text-right">Tổng thuế phải nộp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {taxRateSummaries.length > 0 ? (
                taxRateSummaries.map((group, idx) => {
                  const groupVat = group.revenueAmount * 0.01;
                  const groupPit = group.revenueAmount * 0.005;
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 font-medium">
                        {group.taxRateName || `Hàng hóa chịu thuế suất ${group.taxRatePercentage}%`}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 text-right font-semibold text-slate-800">
                        {formatCurrency(group.revenueAmount)}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-600">
                        1%
                      </td>
                      <td className="p-2.5 border-r border-slate-300 text-right font-semibold text-emerald-700">
                        {formatCurrency(groupVat)}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-600">
                        0.5%
                      </td>
                      <td className="p-2.5 border-r border-slate-300 text-right font-semibold text-indigo-700">
                        {formatCurrency(groupPit)}
                      </td>
                      <td className="p-2.5 text-right font-extrabold text-rose-700">
                        {formatCurrency(group.taxAmount)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-600">1</td>
                  <td className="p-2.5 border-r border-slate-300 font-medium">Phân phối, cung cấp hàng hóa (Thuế suất 8%)</td>
                  <td className="p-2.5 border-r border-slate-300 text-right font-semibold text-slate-800">{formatCurrency(totalRevenue)}</td>
                  <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-600">1%</td>
                  <td className="p-2.5 border-r border-slate-300 text-right font-semibold text-emerald-700">{formatCurrency(vatAmountEstimated)}</td>
                  <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-600">0.5%</td>
                  <td className="p-2.5 border-r border-slate-300 text-right font-semibold text-indigo-700">{formatCurrency(pitAmountEstimated)}</td>
                  <td className="p-2.5 text-right font-extrabold text-rose-700">{formatCurrency(totalTaxAmount)}</td>
                </tr>
              )}
              {/* Dòng Tổng cộng */}
              <tr className="bg-slate-100 font-extrabold text-slate-900">
                <td colSpan={2} className="p-2.5 border-r border-slate-300 text-center uppercase">
                  TỔNG CỘNG NGHĨA VỤ THUẾ CỦA KỲ
                </td>
                <td className="p-2.5 border-r border-slate-300 text-right text-blue-700">
                  {formatCurrency(totalRevenue)}
                </td>
                <td className="p-2.5 border-r border-slate-300 text-center">-</td>
                <td className="p-2.5 border-r border-slate-300 text-right text-emerald-700">
                  {formatCurrency(vatAmountEstimated)}
                </td>
                <td className="p-2.5 border-r border-slate-300 text-center">-</td>
                <td className="p-2.5 border-r border-slate-300 text-right text-indigo-700">
                  {formatCurrency(pitAmountEstimated)}
                </td>
                <td className="p-2.5 text-right text-rose-700 text-sm">
                  {formatCurrency(totalTaxAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Đọc số tiền bằng chữ & Cam kết */}
      <div className="text-xs space-y-2 mb-8 border-t border-slate-200 pt-4">
        <p>
          <strong className="text-slate-800">Tổng số tiền thuế phải nộp bằng chữ:</strong>{" "}
          <span className="font-extrabold text-rose-700 italic">
            {numberToVietnameseWords(totalTaxAmount)}
          </span>
        </p>
        <p className="text-slate-600 italic">
          Tôi cam đoan số liệu khai trên là đúng sự thật và hoàn toàn chịu trách nhiệm trước pháp luật về số liệu đã khai.
        </p>
      </div>

      {/* 6. Chữ ký & Con dấu mô phỏng */}
      <div className="grid grid-cols-2 gap-8 text-center text-xs mt-6">
        <div>
          <p className="font-bold uppercase text-slate-600">NHÂN VIÊN KẾ TOÁN LẬP TỜ KHAI</p>
          <p className="text-[11px] text-slate-400 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
          <div className="h-20 flex items-center justify-center text-slate-400 italic text-[11px]">
            [Đã xác thực chữ ký nội bộ]
          </div>
        </div>
        <div>
          <p className="text-slate-600 italic">
            Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {period?.year || new Date().getFullYear()}
          </p>
          <p className="font-bold uppercase text-slate-800 mt-1">
            NGƯỜI NỘP THUẾ hoặc ĐẠI DIỆN HỢP PHÁP
          </p>
          <p className="text-[11px] text-slate-400 italic mt-0.5">(Ký, đóng dấu hoặc ký số điện tử)</p>
          <div className="h-20 flex flex-col items-center justify-center">
            <div className="border border-emerald-500 bg-emerald-50 px-3 py-1 rounded text-emerald-800 font-extrabold text-[10px] uppercase">
              ✓ Ký điện tử: {householdData?.name || "Hộ kinh doanh Bán Hàng Việt"}
            </div>
            <span className="font-bold text-slate-800 mt-1">
              {householdData?.representativeName || "Chủ hộ kinh doanh"}
            </span>
          </div>
        </div>
      </div>

      {/* Watermark / Footer ghi chú mô phỏng */}
      <div className="text-center mt-8 pt-4 border-t border-dashed border-slate-200 text-[10px] text-slate-400">
        BẢN TỜ KHAI MÔ PHỎNG PHỤC VỤ KÊ KHAI THUẾ THEO DOANH THU THỰC TẾ HÓA ĐƠN ĐIỆN TỬ
      </div>
    </div>
  );
};
