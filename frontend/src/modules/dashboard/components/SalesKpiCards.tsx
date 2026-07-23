import { FileSpreadsheet, AlertCircle, TrendingUp, HelpCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface SalesKpiCardsProps {
  totalRevenue: number;
  totalOrders: number;
  totalFailedInvoices: number;
}

export const SalesKpiCards = ({
  totalRevenue,
  totalOrders,
  totalFailedInvoices,
}: SalesKpiCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: Số đơn bán hàng */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            Số đơn bán hàng
          </span>
          <h3 className="text-2xl font-black text-slate-800 mt-1">
            {totalOrders}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+ 12.5%</span>
            <span className="text-slate-400 font-medium ml-1">vs hôm qua</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-blue-50 text-kv-blue-primary rounded-full flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
      </div>

      {/* Card 2: Hóa đơn gửi lỗi */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            Hóa đơn gửi lỗi
          </span>
          <h3 className="text-2xl font-black text-slate-800 mt-1">
            {totalFailedInvoices}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-rose-500 font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Cần gửi lại CQT</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Card 3: Tổng doanh thu */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            Tổng doanh thu
          </span>
          <h3 className="text-2xl font-black text-slate-800 mt-1">
            {formatCurrency(totalRevenue)}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+ 15.3%</span>
            <span className="text-slate-400 font-medium ml-1">vs hôm qua</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      </div>

      {/* Card 4: So sánh hai kỳ (Có thể phát triển sau) */}
      <div className="bg-slate-50/50 p-5 rounded-xl border border-dashed border-slate-200 flex items-center justify-between relative group overflow-hidden">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              So sánh hai kỳ
            </span>
            <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase scale-90">
              Khảo sát
            </span>
          </div>
          <h3 className="text-base font-black text-slate-500 mt-1.5 italic">
            Có thể phát triển sau
          </h3>
          <span className="text-[10px] text-slate-400 mt-1 block font-medium">
            (Tính năng đang lên kế hoạch)
          </span>
        </div>
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center shrink-0">
          <HelpCircle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
