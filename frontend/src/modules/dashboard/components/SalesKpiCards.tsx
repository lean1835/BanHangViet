import { DASHBOARD_KPI, DASHBOARD_SECTIONS } from "@/constants/dashboard";
import { formatCurrency } from "@/utils/formatCurrency";

interface SalesKpiCardsProps {
  totalRevenueToday: number;
  totalInvoiceCountToday: number;
}

export const SalesKpiCards = ({
  totalRevenueToday,
  totalInvoiceCountToday,
}: SalesKpiCardsProps) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
    <h3 className="font-extrabold text-slate-800 text-sm mb-4">
      {DASHBOARD_SECTIONS.TODAY_RESULT}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {DASHBOARD_SECTIONS.REVENUE}
          </div>
          <div className="text-xl font-extrabold text-slate-800">
            {formatCurrency(totalRevenueToday)}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            {totalInvoiceCountToday} {DASHBOARD_KPI.ISSUED_INVOICE_SUFFIX}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {DASHBOARD_SECTIONS.RETURNS}
          </div>
          <div className="text-xl font-extrabold text-slate-800">
            {DASHBOARD_KPI.RETURN_VALUE}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            {DASHBOARD_KPI.RETURN_COUNT_LABEL}
          </div>
        </div>
      </div>
    </div>
  </div>
);
