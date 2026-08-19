import React from "react";
import { DollarSign, Percent, FileCheck, Layers } from "lucide-react";
import type {
  ITaxDeclarationPeriodResponse,
  ITaxRevenueSummaryResponse,
} from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";

interface ITaxSummaryKpiCardsProps {
  period?: ITaxDeclarationPeriodResponse;
  summary?: ITaxRevenueSummaryResponse;
  isLoading?: boolean;
}

export const TaxSummaryKpiCards: React.FC<ITaxSummaryKpiCardsProps> = ({
  period,
  summary,
  isLoading = false,
}) => {
  const totalRevenue = summary?.totalRevenue ?? period?.totalRevenue ?? 0;
  const totalTaxAmount = summary?.totalTaxAmount ?? period?.totalTaxAmount ?? 0;
  const validInvoicesCount = period?.totalValidInvoices ?? 0;

  // Tính thuế GTGT (1%) và TNCN (0.5%) ước tính cho hộ kinh doanh phương pháp kê khai
  // Theo Thông tư 40/2021/TT-BTC: Thuế GTGT = 1%, Thuế TNCN = 0.5% trên doanh thu bán buôn/bán lẻ hàng hóa
  const vatAmountEstimated = totalTaxAmount * (1.0 / 1.5);
  const pitAmountEstimated = totalTaxAmount * (0.5 / 1.5);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse h-32"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-8 bg-slate-200 rounded-xl" />
            </div>
            <div className="h-6 w-32 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-20 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 4 Thẻ KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Doanh thu chịu thuế */}
        <div className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              Tổng doanh thu chịu thuế
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs">
              <DollarSign className="w-4 h-4 shrink-0 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            <span>{validInvoicesCount} HĐ hợp lệ trong kỳ</span>
          </div>
        </div>

        {/* KPI 2: Thuế GTGT tạm tính */}
        <div className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              Thuế GTGT phát sinh
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs">
              <Percent className="w-4 h-4 shrink-0 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 tracking-tight">
            {formatCurrency(vatAmountEstimated)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Tỷ lệ 1% trên doanh thu bán buôn/bán lẻ
          </div>
        </div>

        {/* KPI 3: Thuế TNCN tạm tính */}
        <div className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              Thuế TNCN phát sinh
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs">
              <Layers className="w-4 h-4 shrink-0 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-600 tracking-tight">
            {formatCurrency(pitAmountEstimated)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Tỷ lệ 0.5% trên doanh thu bán hàng hóa
          </div>
        </div>

        {/* KPI 4: Tổng thuế phải nộp */}
        <div className="group bg-gradient-to-br from-white to-rose-50/60 rounded-2xl border border-rose-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-rose-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-700">
              Tổng số thuế phải nộp
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs">
              <FileCheck className="w-4 h-4 shrink-0 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 tracking-tight">
            {formatCurrency(totalTaxAmount)}
          </div>
          <div className="mt-2 text-[11px] text-rose-500 font-semibold">
            Tổng nghĩa vụ thuế vào NSNN
          </div>
        </div>
      </div>

      {/* Bảng chi tiết tổng hợp theo mức thuế suất (NCL-12-CN-002) */}
      {summary?.taxRateSummaries && summary.taxRateSummaries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.2]" />
              <h4 className="font-bold text-sm text-slate-800">
                Phân bổ doanh thu theo từng mức thuế suất
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {summary.taxRateSummaries.length} nhóm mức thuế suất
            </span>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3 text-center w-12">STT</th>
                  <th className="p-3">Mức thuế suất</th>
                  <th className="p-3">Mô tả / Tên ngành hàng</th>
                  <th className="p-3 text-center">Số lượng HĐ</th>
                  <th className="p-3 text-right">Doanh thu chịu thuế</th>
                  <th className="p-3 text-right">Tiền thuế phát sinh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {summary.taxRateSummaries.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="p-3 font-bold text-blue-700">
                      Thuế suất {item.taxRatePercentage}%
                    </td>
                    <td className="p-3 text-slate-700 font-medium">
                      {item.taxRateName ||
                        `Nhóm hàng chịu thuế suất ${item.taxRatePercentage}%`}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600">
                      {item.invoiceCount}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.revenueAmount)}
                    </td>
                    <td className="p-3 text-right font-bold text-rose-600">
                      {formatCurrency(item.taxAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
