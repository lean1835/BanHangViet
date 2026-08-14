import React from "react";
import { DollarSign, Receipt, Percent, FileCheck } from "lucide-react";
import type { ITaxDeclarationSummary } from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";
import { REPORT_UI } from "@/constants/report";

interface ITaxSummaryKpiCardsProps {
  summary: ITaxDeclarationSummary;
}

export const TaxSummaryKpiCards: React.FC<ITaxSummaryKpiCardsProps> = ({
  summary,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Doanh thu chịu thuế */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">
            {REPORT_UI.TAX_DECLARATION.KPI.TOTAL_REVENUE}
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-slate-800">
          {formatCurrency(summary.totalRevenue)}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
          <span>{summary.validInvoicesCount} HĐ hợp lệ</span>
          {summary.adjustedInvoicesCount > 0 && (
            <span className="text-amber-600 font-semibold">
              (-{summary.adjustedInvoicesCount} HĐ giảm)
            </span>
          )}
        </div>
      </div>

      {/* KPI 2: Thuế GTGT mô phỏng */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">
            {REPORT_UI.TAX_DECLARATION.KPI.VAT_AMOUNT}
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-emerald-600">
          {formatCurrency(summary.totalVatAmount)}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 font-medium">
          Mô phỏng theo thuế suất 5%, 8%, 10%
        </div>
      </div>

      {/* KPI 3: Thuế TNCN mô phỏng */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">
            {REPORT_UI.TAX_DECLARATION.KPI.PIT_AMOUNT}
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-indigo-600">
          {formatCurrency(summary.totalPitAmount)}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 font-medium">
          Tỷ lệ thuế TNCN theo ngành nghề
        </div>
      </div>

      {/* KPI 4: Tổng thuế phải nộp */}
      <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-white to-rose-50/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-rose-700">
            {REPORT_UI.TAX_DECLARATION.KPI.TOTAL_PAYABLE}
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-rose-600">
          {formatCurrency(summary.totalPayableTaxAmount)}
        </div>
        <div className="mt-2 text-[11px] text-rose-500 font-semibold">
          Tổng nghĩa vụ thuế của kỳ kê khai
        </div>
      </div>
    </div>
  );
};
